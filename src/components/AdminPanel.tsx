import React, { useState, useEffect } from 'react';
import {
  Building, ClipboardList, CheckCircle2, ChevronRight, Download, Eye, Clock,
  ShieldCheck, AlertCircle, PhoneCall, Plus, LogOut, ArrowLeft, X, TrendingUp,
  DollarSign, Activity, Settings, UserCheck, Trash2, Edit2, Search, Filter, RefreshCw, MapPin,
  FileText, Briefcase, LayoutGrid, ArrowUp, ArrowDown, MessageSquareWarning, Tent, MessageSquare
} from 'lucide-react';
import { Booking, Patient, DiagnosticService, HealthPackage, CartItem, HomepageSection, ClinicCenter, PatientComplaint, Doctor } from '../types';

import { auth } from '../lib/firebase.ts';
import { adminFetch } from '../lib/sessionGuard.ts';

const cleanBookingId = (id: string) => id.split('-').slice(0, 2).join('-');

interface AdminPanelProps {
  currentTab: string;
  setCurrentTab: (tab: 'home' | 'scans' | 'labs' | 'packages' | 'admin') => void;
  bookingRefreshKey?: number;
  services: DiagnosticService[];
  onUpdateServices: (services: DiagnosticService[]) => void;
  packages?: HealthPackage[];
  onUpdatePackages?: (packages: HealthPackage[]) => void;
  sections?: HomepageSection[];
  onUpdateSections?: (sections: HomepageSection[]) => void;
  centers?: ClinicCenter[];
  onUpdateCenters?: (centers: ClinicCenter[]) => void;
  doctors?: Doctor[];
  onUpdateDoctors?: (doctors: Doctor[]) => void;
}

// Default pre-seeded clinical data for our laboratory reports
const INITIAL_LAB_RESULTS: Record<string, Array<{ parameter: string; result: string; unit: string; range: string; status: 'normal' | 'high' | 'low' }>> = {
  'lab-thyroid': [
    { parameter: 'Triiodothyronine (T3, Total)', result: '1.25', unit: 'ng/mL', range: '0.80 - 2.00', status: 'normal' },
    { parameter: 'Thyroxine (T4, Total)', result: '8.4', unit: 'µg/dL', range: '5.1 - 14.1', status: 'normal' },
    { parameter: 'Thyroid Stimulating Hormone (Ultra-TSH)', result: '2.14', unit: 'µIU/mL', range: '0.40 - 4.50', status: 'normal' }
  ],
  'lab-vitamin-d': [
    { parameter: '25-Hydroxy Vitamin D (Total)', result: '18.4', unit: 'ng/mL', range: '30.0 - 100.0 (Deficient: <20)', status: 'low' }
  ],
  'lab-cbc': [
    { parameter: 'Hemoglobin (Hb)', result: '14.2', unit: 'g/dL', range: '13.0 - 17.0', status: 'normal' },
    { parameter: 'Total WBC Count (Leukocytes)', result: '7,400', unit: '/cumm', range: '4,000 - 11,000', status: 'normal' },
    { parameter: 'Platelet Count', result: '2.45', unit: 'Lakhs/cumm', range: '1.50 - 4.50', status: 'normal' },
    { parameter: 'Red Blood Cell (RBC) Count', result: '4.9', unit: 'million/cumm', range: '4.5 - 5.5', status: 'normal' }
  ],
  'lab-diabetes': [
    { parameter: 'Fasting Blood Sugar (FBS)', result: '94', unit: 'mg/dL', range: '70 - 100', status: 'normal' },
    { parameter: 'Glycated Hemoglobin (HbA1c)', result: '5.4', unit: '%', range: '4.0 - 5.6', status: 'normal' }
  ],
  'lab-urine-routine': [
    { parameter: 'Urine pH', result: '6.0', unit: '', range: '5.0 - 7.5', status: 'normal' },
    { parameter: 'Urine Glucose / Sugar', result: 'Negative', unit: '', range: 'Negative', status: 'normal' },
    { parameter: 'Urine Proteins / Albumin', result: 'Negative', unit: '', range: 'Negative', status: 'normal' }
  ]
};

// Seeding historic bookings inside Malad and Goregaon branches
const DEFAULT_ADMIN_BOOKINGS: Booking[] = [
  {
    id: 'b-admin-1',
    bookingId: 'ASX-984310',
    patient: { name: 'Vy9892 Patel', age: 29, gender: 'Male', relationship: 'Self' },
    items: [
      { itemId: 'lab-thyroid', itemType: 'service', name: 'Thyroid Profile (T3, T4, Ultra-TSH)', price: 800, discountPrice: 390, category: 'lab' },
      { itemId: 'lab-vitamin-d', itemType: 'service', name: 'Vitamin D (25-Hydroxy)', price: 1500, discountPrice: 690, category: 'lab' }
    ],
    appointmentDate: '2026-07-01',
    appointmentTime: '08:00 AM - 10:00 AM',
    collectionType: 'home',
    address: { street: 'Flat 405, Blue Meadows, S.V. Road', city: 'Malad', pincode: '400064' },
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    bookingStatus: 'report_ready',
    totalAmount: 1230,
    timestamp: '2026-07-01T08:15:00.000Z',
    simulatedReportUrl: '/reports/ASX-984310.pdf'
  },
  {
    id: 'b-admin-2',
    bookingId: 'ASX-751294',
    patient: { name: 'Meera Sharma', age: 45, gender: 'Female', relationship: 'Other' },
    items: [
      { itemId: 'scan-xray-chest', itemType: 'service', name: 'Digital X-Ray Chest PA View', price: 600, discountPrice: 350, category: 'scan' }
    ],
    appointmentDate: '2026-07-04',
    appointmentTime: '11:00 AM - 12:00 PM',
    collectionType: 'center',
    address: { street: 'Goregaon Hub Center Visit', city: 'Goregaon', pincode: '400063' },
    paymentMethod: 'card',
    paymentStatus: 'paid',
    bookingStatus: 'sample_collected',
    totalAmount: 350,
    timestamp: '2026-07-04T11:30:00.000Z',
    simulatedReportUrl: '/reports/ASX-751294.pdf'
  },
  {
    id: 'b-admin-3',
    bookingId: 'ASX-112399',
    patient: { name: 'Rajesh Mehta', age: 52, gender: 'Male', relationship: 'Other' },
    items: [
      { itemId: 'lab-diabetes', itemType: 'service', name: 'Diabetic Screening Profile', price: 900, discountPrice: 450, category: 'lab' }
    ],
    appointmentDate: '2026-07-06',
    appointmentTime: '09:00 AM - 11:00 AM',
    collectionType: 'center',
    address: { street: 'Malad West Clinic Walk-in', city: 'Malad', pincode: '400064' },
    paymentMethod: 'netbanking',
    paymentStatus: 'paid',
    bookingStatus: 'booked',
    totalAmount: 450,
    timestamp: '2026-07-06T09:10:00.000Z'
  }
];

export default function AdminPanel({
  currentTab,
  setCurrentTab,
  bookingRefreshKey = 0,
  services,
  onUpdateServices,
  packages = [],
  onUpdatePackages = () => { },
  sections = [],
  onUpdateSections = () => { },
  centers = [],
  onUpdateCenters = () => { },
  doctors = [],
  onUpdateDoctors = () => { }
}: AdminPanelProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    const hasFlag = localStorage.getItem('assurx_admin_auth') === 'true' || sessionStorage.getItem('assurx_admin_auth') === 'true';
    const hasSession = !!localStorage.getItem('adminSession');
    // Both the auth flag AND a valid session ID must be present.
    // If the flag exists but no session, it's stale (leftover from before
    // the single-session system was introduced) — clear it and force re-login.
    if (hasFlag && !hasSession) {
      localStorage.removeItem('assurx_admin_auth');
      sessionStorage.removeItem('assurx_admin_auth');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminKey');
      return false;
    }
    return hasFlag && hasSession;
  });
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [attempts, setAttempts] = useState<number>(0);
  const [lockUntil, setLockUntil] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    // Clear lock on load if any was set previously
    localStorage.removeItem('assurx_admin_lock_until');
    localStorage.setItem('assurx_admin_attempts', '0');
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = adminEmailInput.trim().toLowerCase();
    const password = adminPasswordInput.trim();
    const key = adminKeyInput.trim();

    try {
      // Validate credentials server-side — this also generates & stores a session ID
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, key }),
      });

      if (res.ok) {
        const data = await res.json();
        // Persist the session ID (kicks any other device)
        localStorage.setItem('adminSession', data.sessionId);
        localStorage.setItem('adminEmail', email);
        localStorage.setItem('adminKey', key);
        setIsAdminAuthenticated(true);
        localStorage.setItem('assurx_admin_auth', 'true');
        sessionStorage.setItem('assurx_admin_auth', 'true');
        setAuthError('');
        setAttempts(0);
        setLockUntil(0);
        localStorage.setItem('assurx_admin_attempts', '0');
        localStorage.removeItem('assurx_admin_lock_until');
      } else {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Invalid administrator credentials or security key.');
      }
    } catch (err) {
      console.error('Admin login network error:', err);
      setAuthError('Network error. Please check your connection and try again.');
    }
  };

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'catalog' | 'manual' | 'analytics' | 'prescriptions' | 'careers' | 'sections' | 'branches' | 'complaints' | 'packages' | 'doctors' | 'security'>('dispatcher');

  // Security credentials state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminKey, setNewAdminKey] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword && !newAdminKey) {
      setSecurityMessage({ type: 'error', text: 'Please fill in at least one field to update.' });
      return;
    }
    setSecurityLoading(true);
    setSecurityMessage(null);

    try {
      const email = localStorage.getItem('adminEmail') || '';
      const session = localStorage.getItem('adminSession') || '';
      const currentKey = localStorage.getItem('adminKey') || '';

      const res = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-admin-session': session,
          'x-admin-key': currentKey
        },
        body: JSON.stringify({
          newPassword: newAdminPassword.trim() || undefined,
          newKey: newAdminKey.trim() || undefined
        })
      });

      if (res.ok) {
        setSecurityMessage({ type: 'success', text: 'Credentials updated successfully!' });
        if (newAdminKey.trim()) {
          localStorage.setItem('adminKey', newAdminKey.trim());
        }
        setNewAdminPassword('');
        setNewAdminKey('');
      } else {
        const errData = await res.json().catch(() => ({}));
        setSecurityMessage({ type: 'error', text: errData.error || 'Failed to update credentials.' });
      }
    } catch (err) {
      console.error('Error updating security credentials:', err);
      setSecurityMessage({ type: 'error', text: 'Network connection failed.' });
    } finally {
      setSecurityLoading(false);
    }
  };

  // Complaints state
  const [complaints, setComplaints] = useState<PatientComplaint[]>([]);
  const [complaintFilter, setComplaintFilter] = useState<'all' | PatientComplaint['status']>('all');
  const [editingComplaintId, setEditingComplaintId] = useState<string | null>(null);
  const [complaintAdminNote, setComplaintAdminNote] = useState('');

  // Packages Manager State
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDiscountPrice, setPkgDiscountPrice] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgTestsCount, setPkgTestsCount] = useState('');
  const [pkgIncludedTests, setPkgIncludedTests] = useState('');
  const [pkgIdealFor, setPkgIdealFor] = useState('');
  const [pkgFrequency, setPkgFrequency] = useState('');
  const [pkgPreparation, setPkgPreparation] = useState('');
  const [pkgPopular, setPkgPopular] = useState(false);
  const [pkgSearch, setPkgSearch] = useState('');
  const [applications, setApplications] = useState<any[]>([]);

  // Doctor Manager State
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [docName, setDocName] = useState('');
  const [docSpecialization, setDocSpecialization] = useState('Cardiologist');
  const [docExperience, setDocExperience] = useState('');
  const [docQualification, setDocQualification] = useState('');
  const [docTiming, setDocTiming] = useState('09:00 AM - 01:00 PM');
  const [docBranch, setDocBranch] = useState('Malad');
  const [docAvatar, setDocAvatar] = useState('');
  const [docSearch, setDocSearch] = useState('');

  const resetDoctorForm = () => {
    setDocName('');
    setDocSpecialization('Cardiologist');
    setDocExperience('');
    setDocQualification('');
    setDocTiming('09:00 AM - 01:00 PM');
    setDocBranch('Malad');
    setDocAvatar('');
    setEditingDoctorId(null);
    setIsAddingDoctor(false);
  };

  // Sections Manager State
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [secTitle, setSecTitle] = useState('');
  const [secSubtitle, setSecSubtitle] = useState('');
  const [secCategory, setSecCategory] = useState<'scan' | 'lab' | 'all'>('all');
  const [secViewAllTab, setSecViewAllTab] = useState<'scans' | 'labs'>('scans');
  const [secBannerImage, setSecBannerImage] = useState('');
  const [secBannerTag, setSecBannerTag] = useState('');
  const [secBannerTitle, setSecBannerTitle] = useState('');
  const [secServiceIds, setSecServiceIds] = useState<string[]>([]);

  const resetSectionForm = () => {
    setSecTitle('');
    setSecSubtitle('');
    setSecCategory('all');
    setSecViewAllTab('scans');
    setSecBannerImage('');
    setSecBannerTag('');
    setSecBannerTitle('');
    setSecServiceIds([]);
    setEditingSectionId(null);
    setIsAddingSection(false);
  };

  const handleAddPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      showToast('Please enter a package name.', 'error');
      return;
    }

    // Generate unique ID
    const generatedId = `pkg-${pkgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const newPkg: HealthPackage = {
      id: generatedId,
      name: pkgName.trim(),
      price: Number(pkgPrice) || 0,
      discountPrice: pkgDiscountPrice ? Number(pkgDiscountPrice) : undefined,
      description: pkgDescription.trim() || `${pkgName.trim()} health checkup package.`,
      testsCount: Number(pkgTestsCount) || 0,
      includedTests: pkgIncludedTests.split(',').map(t => t.trim()).filter(Boolean),
      idealFor: pkgIdealFor.trim() || 'Men & Women',
      frequency: pkgFrequency.trim() || 'Once a year',
      preparation: pkgPreparation.trim() || 'No specific preparation required.',
      popular: pkgPopular
    };

    try {
      const res = await adminFetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPkg)
      });
      if (!res.ok) throw new Error("Failed to create package");
      const updated = [...packages, newPkg];
      onUpdatePackages(updated);

      // Reset Form
      setPkgName('');
      setPkgPrice('');
      setPkgDiscountPrice('');
      setPkgDescription('');
      setPkgTestsCount('');
      setPkgIncludedTests('');
      setPkgIdealFor('');
      setPkgFrequency('');
      setPkgPreparation('');
      setPkgPopular(false);
      setIsAddingPackage(false);

      showToast('New health package added successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save health package to database.', 'error');
    }
  };

  const handleEditPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      showToast('Please enter a package name.', 'error');
      return;
    }

    const updatedFields = {
      name: pkgName.trim(),
      price: Number(pkgPrice) || 0,
      discountPrice: pkgDiscountPrice ? Number(pkgDiscountPrice) : undefined,
      description: pkgDescription.trim(),
      testsCount: Number(pkgTestsCount) || 0,
      includedTests: pkgIncludedTests.split(',').map(t => t.trim()).filter(Boolean),
      idealFor: pkgIdealFor.trim(),
      frequency: pkgFrequency.trim(),
      preparation: pkgPreparation.trim(),
      popular: pkgPopular
    };

    try {
      const res = await adminFetch(`/api/admin/packages/${editingPackageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error("Failed to update package");
      
      const updated = packages.map(pkg => {
        if (pkg.id === editingPackageId) {
          return { ...pkg, ...updatedFields };
        }
        return pkg;
      });

      onUpdatePackages(updated);
      setEditingPackageId(null);
      setIsAddingPackage(false);

      // Reset Form
      setPkgName('');
      setPkgPrice('');
      setPkgDiscountPrice('');
      setPkgDescription('');
      setPkgTestsCount('');
      setPkgIncludedTests('');
      setPkgIdealFor('');
      setPkgFrequency('');
      setPkgPreparation('');
      setPkgPopular(false);

      showToast('Health package updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update health package in database.', 'error');
    }
  };

  const handleDeletePackage = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this health package?");
    if (confirmDelete) {
      try {
        const res = await adminFetch(`/api/admin/packages/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete package");
        const updated = packages.filter(p => p.id !== id);
        onUpdatePackages(updated);
        showToast('Health package deleted successfully!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete health package from database.', 'error');
      }
    }
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setSecBannerImage(result);
          showToast('Image uploaded successfully!', 'success');
        }
      };
      reader.onerror = () => {
        showToast('Failed to read image file.', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDoctorAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setDocAvatar(result);
          showToast('Doctor image uploaded successfully!', 'success');
        }
      };
      reader.onerror = () => {
        showToast('Failed to read image file.', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  // Clinic branch management states
  const [editingCenterCity, setEditingCenterCity] = useState<string | null>(null);
  const [editCenterCity, setEditCenterCity] = useState('');
  const [editCenterAddress, setEditCenterAddress] = useState('');
  const [editCenterPhone, setEditCenterPhone] = useState('');
  const [editCenterWhatsappNumber, setEditCenterWhatsappNumber] = useState('');

  const [isAddingCenter, setIsAddingCenter] = useState(false);
  const [newCenterCity, setNewCenterCity] = useState('');
  const [newCenterAddress, setNewCenterAddress] = useState('');
  const [newCenterPhone, setNewCenterPhone] = useState('');
  const [newCenterWhatsappNumber, setNewCenterWhatsappNumber] = useState('');

  const handleStartEditCenter = (center: ClinicCenter) => {
    setEditingCenterCity(center.city);
    setEditCenterCity(center.city);
    setEditCenterAddress(center.address);
    setEditCenterPhone(center.phone);
    setEditCenterWhatsappNumber(center.whatsappNumber || center.phone || '');
  };

  const handleSaveCenter = async (originalCity: string) => {
    if (!editCenterCity.trim() || !editCenterAddress.trim() || !editCenterPhone.trim()) {
      showToast('Please enter Branch Name, Address, and Phone Number.', 'error');
      return;
    }
    if (
      editCenterCity.trim().toLowerCase() !== originalCity.toLowerCase() &&
      centers.some(c => c.city.toLowerCase() === editCenterCity.trim().toLowerCase())
    ) {
      showToast(`A branch with the name "${editCenterCity.trim()}" already exists.`, 'error');
      return;
    }
    const updatedFields = {
      city: editCenterCity.trim(),
      address: editCenterAddress.trim(),
      phone: editCenterPhone.trim(),
      whatsappNumber: editCenterWhatsappNumber.trim() || editCenterPhone.trim()
    };
    try {
      const res = await adminFetch(`/api/admin/centers/${encodeURIComponent(originalCity)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error("Failed to update center");
      const updated = centers.map(c => {
        if (c.city === originalCity) {
          return { ...c, ...updatedFields };
        }
        return c;
      });
      onUpdateCenters(updated);
      setEditingCenterCity(null);
      showToast(`Branch "${updatedFields.city}" updated in database successfully!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update branch in database.', 'error');
    }
  };

  const handleAddCenterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenterCity.trim() || !newCenterAddress.trim() || !newCenterPhone.trim()) {
      showToast('Please fill out all required branch fields.', 'error');
      return;
    }
    if (centers.some(c => c.city.toLowerCase() === newCenterCity.trim().toLowerCase())) {
      showToast(`A branch with the name "${newCenterCity.trim()}" already exists.`, 'error');
      return;
    }
    const newCenter: ClinicCenter = {
      city: newCenterCity.trim(),
      address: newCenterAddress.trim(),
      phone: newCenterPhone.trim(),
      whatsappNumber: newCenterWhatsappNumber.trim() || newCenterPhone.trim()
    };
    try {
      const res = await adminFetch('/api/admin/centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCenter)
      });
      if (!res.ok) throw new Error("Failed to add center");
      const updated = [...centers, newCenter];
      onUpdateCenters(updated);

      setNewCenterCity('');
      setNewCenterAddress('');
      setNewCenterPhone('');
      setNewCenterWhatsappNumber('');
      setIsAddingCenter(false);
      showToast(`New branch ${newCenter.city} registered in database successfully!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save branch to database.', 'error');
    }
  };

  const handleDeleteCenter = async (city: string) => {
    if (centers.length <= 1) {
      showToast('Cannot delete the last remaining clinic branch center.', 'error');
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete the ${city} branch from the directory?`);
    if (confirmDelete) {
      try {
        const res = await adminFetch(`/api/admin/centers/${city}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete center");
        const updated = centers.filter(c => c.city !== city);
        onUpdateCenters(updated);
        showToast(`${city} branch deleted from database successfully.`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete branch from database.', 'error');
      }
    }
  };

  const handleAddSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secTitle.trim()) {
      showToast('Please enter a section title.', 'error');
      return;
    }
    const newSection: HomepageSection = {
      id: `section-${Date.now()}`,
      title: secTitle.trim(),
      subtitle: secSubtitle.trim() || 'Custom Offerings Panel',
      category: secCategory,
      viewAllTab: secViewAllTab,
      bannerImage: secBannerImage.trim() || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
      bannerTag: secBannerTag.trim() || 'Clinic Showcase',
      bannerTitle: secBannerTitle.trim() || 'State-of-the-Art Diagnostics',
      serviceIds: secServiceIds
    };
    const updated = [...sections, newSection];
    onUpdateSections(updated);
    resetSectionForm();
    showToast('New homepage section created successfully!', 'success');
  };

  const handleEditSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secTitle.trim()) {
      showToast('Please enter a section title.', 'error');
      return;
    }
    const updated = sections.map(s => {
      if (s.id === editingSectionId) {
        return {
          ...s,
          title: secTitle.trim(),
          subtitle: secSubtitle.trim() || 'Custom Offerings Panel',
          category: secCategory,
          viewAllTab: secViewAllTab,
          bannerImage: secBannerImage.trim() || s.bannerImage,
          bannerTag: secBannerTag.trim() || 'Clinic Showcase',
          bannerTitle: secBannerTitle.trim() || 'State-of-the-Art Diagnostics',
          serviceIds: secServiceIds
        };
      }
      return s;
    });
    onUpdateSections(updated);
    resetSectionForm();
    showToast('Homepage section updated successfully!', 'success');
  };

  const handleOpenEditSection = (section: HomepageSection) => {
    setEditingSectionId(section.id);
    setSecTitle(section.title);
    setSecSubtitle(section.subtitle);
    setSecCategory(section.category);
    setSecViewAllTab(section.viewAllTab);
    setSecBannerImage(section.bannerImage);
    setSecBannerTag(section.bannerTag);
    setSecBannerTitle(section.bannerTitle);
    setSecServiceIds(section.serviceIds || []);
    setIsAddingSection(true);
  };

  const handleDeleteSection = (id: string) => {
    triggerConfirm(
      'Delete Homepage Section',
      'Are you sure you want to permanently delete this homepage offering section? This will immediately remove it from the public homepage.',
      'Delete Section',
      () => {
        const updated = sections.filter(s => s.id !== id);
        onUpdateSections(updated);
        showToast('Homepage section deleted successfully!', 'success');
      }
    );
  };

  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      showToast('Please enter a doctor name.', 'error');
      return;
    }
    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      name: docName.trim(),
      specialization: docSpecialization,
      experience: parseInt(docExperience, 10) || 0,
      qualification: docQualification.trim() || 'MBBS',
      timing: docTiming.trim() || '09:00 AM - 01:00 PM',
      branch: docBranch,
      avatar: docAvatar.trim() || 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=300&auto=format&fit=crop'
    };
    try {
      const res = await adminFetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      if (!res.ok) throw new Error("Failed to save doctor");
      const updated = [...doctors, newDoc];
      onUpdateDoctors(updated);
      resetDoctorForm();
      showToast('New doctor added to database successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save doctor to database.', 'error');
    }
  };

  const handleEditDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      showToast('Please enter a doctor name.', 'error');
      return;
    }
    const updatedFields = {
      name: docName.trim(),
      specialization: docSpecialization,
      experience: parseInt(docExperience, 10) || 0,
      qualification: docQualification.trim(),
      timing: docTiming.trim(),
      branch: docBranch,
      avatar: docAvatar.trim() || 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=300&auto=format&fit=crop'
    };
    try {
      const res = await adminFetch(`/api/admin/doctors/${editingDoctorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error("Failed to update doctor");
      const updated = doctors.map(d => {
        if (d.id === editingDoctorId) {
          return { ...d, ...updatedFields };
        }
        return d;
      });
      onUpdateDoctors(updated);
      resetDoctorForm();
      showToast('Doctor profile updated in database successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update doctor in database.', 'error');
    }
  };

  const handleOpenEditDoctor = (doc: Doctor) => {
    setEditingDoctorId(doc.id);
    setDocName(doc.name);
    setDocSpecialization(doc.specialization);
    setDocExperience(String(doc.experience));
    setDocQualification(doc.qualification);
    setDocTiming(doc.timing);
    setDocBranch(doc.branch);
    setDocAvatar(doc.avatar);
    setIsAddingDoctor(true);
  };

  const handleDeleteDoctor = async (id: string) => {
    triggerConfirm(
      'Delete Doctor Profile',
      'Are you sure you want to delete this doctor profile? This will permanently remove them from the database and public directory.',
      'Delete Profile',
      async () => {
        try {
          const res = await adminFetch(`/api/admin/doctors/${id}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error("Failed to delete doctor");
          const updated = doctors.filter(d => d.id !== id);
          onUpdateDoctors(updated);
          showToast('Doctor profile deleted from database successfully.', 'success');
        } catch (err) {
          console.error(err);
          showToast('Failed to delete doctor from database.', 'error');
        }
      }
    );
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const updated = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      onUpdateSections(updated);
      showToast('Homepage section layout reordered!', 'success');
    }
  };

  const toggleSectionServiceSelection = (id: string) => {
    if (secServiceIds.includes(id)) {
      setSecServiceIds(secServiceIds.filter(x => x !== id));
    } else {
      setSecServiceIds([...secServiceIds, id]);
    }
  };

  // Custom Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Custom Confirm modal state
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, confirmText: string, action: () => void | Promise<void>) => {
    setConfirmAction({
      title,
      message,
      confirmText,
      onConfirm: async () => {
        try {
          await action();
        } catch (err) {
          console.error("Error executing confirmed action:", err);
        } finally {
          setConfirmAction(null);
        }
      }
    });
  };

  // Filtering states
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<'All' | 'Malad' | 'Goregaon'>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | Booking['bookingStatus']>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideMockData, setHideMockData] = useState(false);

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedLeadFilter, setSelectedLeadFilter] = useState<'all' | 'camps' | 'prescriptions' | 'callbacks'>('all');

  // Load prescriptions from LocalStorage
  useEffect(() => {
    const prsStr = localStorage.getItem('assurx_prescriptions');
    if (prsStr) {
      setPrescriptions(JSON.parse(prsStr));
    } else {
      setPrescriptions([]);
    }
  }, [currentTab, activeTab]);

  const savePrescriptions = (newPrs: any[]) => {
    setPrescriptions(newPrs);
    localStorage.setItem('assurx_prescriptions', JSON.stringify(newPrs));
  };

  // Editing Reports / Findings states
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [reportResults, setReportResults] = useState<Array<{ parameter: string; result: string; unit: string; range: string; status: 'normal' | 'high' | 'low' }>>([]);
  const [scanFindings, setScanFindings] = useState('');
  const [scanImpression, setScanImpression] = useState('');

  // Editing Patient/Appointment details states
  const [editingPatientBooking, setEditingPatientBooking] = useState<Booking | null>(null);
  const [editedPatientName, setEditedPatientName] = useState('');
  const [editedPatientAge, setEditedPatientAge] = useState<number>(30);
  const [editedPatientGender, setEditedPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editedAppointmentDate, setEditedAppointmentDate] = useState('');
  const [editedAppointmentTime, setEditedAppointmentTime] = useState('');
  const [editedCollectionType, setEditedCollectionType] = useState<'home' | 'center'>('center');
  const [editedStreet, setEditedStreet] = useState('');
  const [editedCity, setEditedCity] = useState('');
  const [editedPincode, setEditedPincode] = useState('');

  // Catalog Pricing edits
  const [catalogSearch, setCatalogSearch] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [editingDiscountPrice, setEditingDiscountPrice] = useState<number>(0);

  // Full edit service modal state
  const [isEditingService, setIsEditingService] = useState(false);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceCategory, setEditServiceCategory] = useState<'scan' | 'lab'>('lab');
  const [editServiceSubCategory, setEditServiceSubCategory] = useState('');
  const [editServicePrice, setEditServicePrice] = useState(0);
  const [editServiceDiscountPrice, setEditServiceDiscountPrice] = useState(0);
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editServicePreparation, setEditServicePreparation] = useState('');
  const [editServiceDuration, setEditServiceDuration] = useState('');
  const [editServiceReportDelivery, setEditServiceReportDelivery] = useState('');
  const [editServicePopular, setEditServicePopular] = useState(false);

  // Add service modal state
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<'scan' | 'lab'>('lab');
  const [newServiceSubCategory, setNewServiceSubCategory] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(1000);
  const [newServiceDiscountPrice, setNewServiceDiscountPrice] = useState(500);
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePreparation, setNewServicePreparation] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('15 mins');
  const [newServiceReportDelivery, setNewServiceReportDelivery] = useState('Same Day');
  const [newServicePopular, setNewServicePopular] = useState(false);

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showToast('Please enter a service name.', 'error');
      return;
    }

    // Generate unique ID
    const generatedId = `${newServiceCategory}-${newServiceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newService: DiagnosticService = {
      id: generatedId,
      name: newServiceName.trim(),
      category: newServiceCategory,
      subCategory: newServiceSubCategory.trim() || (newServiceCategory === 'scan' ? 'General Ultrasound' : 'General Blood Tests'),
      price: Number(newServicePrice) || 0,
      discountPrice: newServiceDiscountPrice ? Number(newServiceDiscountPrice) : undefined,
      description: newServiceDescription.trim() || `${newServiceName.trim()} diagnostics test.`,
      preparation: newServicePreparation.trim() || 'No specific preparation required.',
      duration: newServiceDuration.trim() || '15 mins',
      reportDelivery: newServiceReportDelivery.trim() || 'Same Day',
      popular: newServicePopular
    };

    try {
      const res = await adminFetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });
      if (!res.ok) throw new Error("Failed to save service");
      const updated = [...services, newService];
      onUpdateServices(updated);

      // Reset form
      setNewServiceName('');
      setNewServiceSubCategory('');
      setNewServicePrice(1000);
      setNewServiceDiscountPrice(500);
      setNewServiceDescription('');
      setNewServicePreparation('');
      setNewServiceDuration('15 mins');
      setNewServiceReportDelivery('Same Day');
      setNewServicePopular(false);
      setIsAddingService(false);

      showToast('New diagnostic service added to catalog successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save diagnostic service to database.', 'error');
    }
  };

  // Manual Walk-in Booking state
  const [manualPatientName, setManualPatientName] = useState('');
  const [manualPatientAge, setManualPatientAge] = useState('35');
  const [manualPatientGender, setManualPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [manualBranch, setManualBranch] = useState<'Malad' | 'Goregaon'>('Malad');
  const [manualCollectionType, setManualCollectionType] = useState<'home' | 'center'>('center');
  const [manualSelectedItems, setManualSelectedItems] = useState<string[]>([]); // item IDs
  const [manualDate, setManualDate] = useState('2026-07-06');
  const [manualTime, setManualTime] = useState('08:00 AM - 10:00 AM');
  const [manualAddress, setManualAddress] = useState('');
  const [manualPincode, setManualPincode] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);

  const fetchDatabaseData = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const bookingsRes = await adminFetch('/api/admin/bookings');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();

        // Merge: Include any locally-cached bookings not yet in DB response
        // (handles race condition where admin panel opens before DB read completes)
        const cachedStr = localStorage.getItem('assurx_bookings');
        const cachedBookings: any[] = cachedStr ? JSON.parse(cachedStr) : [];
        const dbIds = new Set(bookingsData.map((b: any) => String(b.id)));
        const localOnlyBookings = cachedBookings.filter(
          (b: any) => b.id && !dbIds.has(String(b.id)) && !String(b.id).startsWith('b-admin-')
        );
        const mergedBookings = localOnlyBookings.length > 0
          ? [...localOnlyBookings, ...bookingsData]
          : bookingsData;

        setBookings(mergedBookings);
        localStorage.setItem('assurx_bookings', JSON.stringify(mergedBookings));
      } else if (bookingsRes.status === 401) {
        // Session kicked — the sessionGuard will fire the kick handler; stop polling
        return;
      } else {
        throw new Error(`Real-time bookings fetch returned status ${bookingsRes.status}`);
      }

      const prescriptionsRes = await adminFetch('/api/admin/prescriptions');
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json();
        setPrescriptions(prescriptionsData);
        localStorage.setItem('assurx_prescriptions', JSON.stringify(prescriptionsData));
      } else if (prescriptionsRes.status !== 401) {
        throw new Error(`Real-time prescriptions fetch returned status ${prescriptionsRes.status}`);
      }

      const careersRes = await adminFetch('/api/admin/careers');
      if (careersRes.ok) {
        const careersData = await careersRes.json();
        setApplications(careersData);
        localStorage.setItem('assurx_applications', JSON.stringify(careersData));
      } else if (careersRes.status !== 401) {
        throw new Error(`Real-time careers fetch returned status ${careersRes.status}`);
      }
    } catch (error) {
      console.error("Failed to load real-time admin records, using cached state.", error);
      // Fallback to LocalStorage
      const cachedBookings = localStorage.getItem('assurx_bookings');
      if (cachedBookings) setBookings(JSON.parse(cachedBookings));

      const cachedPrescriptions = localStorage.getItem('assurx_prescriptions');
      if (cachedPrescriptions) setPrescriptions(JSON.parse(cachedPrescriptions));

      const cachedApplications = localStorage.getItem('assurx_applications');
      if (cachedApplications) setApplications(JSON.parse(cachedApplications));
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Load bookings and prescriptions from the real Cloud SQL database using REST APIs
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    fetchDatabaseData(false); // Non-silent on first load so user sees syncing state

    // Set up a background interval to poll every 5 seconds for live, real-time sync
    const intervalId = setInterval(() => {
      fetchDatabaseData(true);
    }, 5000);

    // Save initial custom clinical results if not exists
    if (!localStorage.getItem('assurx_clinical_results')) {
      localStorage.setItem('assurx_clinical_results', JSON.stringify(INITIAL_LAB_RESULTS));
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [currentTab, activeTab, bookingRefreshKey, isAdminAuthenticated]);

  // Dispatcher actions
  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['bookingStatus']) => {
    const targetId = String(bookingId);
    const targetBooking = bookings.find(b => String(b.id) === targetId || b.bookingId === targetId);
    const bookingCode = targetBooking?.bookingId || targetId;

    const applyLocalUpdate = () => {
      const updated = bookings.map(b => {
        if (String(b.id) === targetId || b.bookingId === targetId || (bookingCode && b.bookingId === bookingCode)) {
          return {
            ...b,
            bookingStatus: newStatus,
            paymentStatus: (newStatus === 'report_ready' ? 'paid' : b.paymentStatus) as 'pending' | 'paid'
          };
        }
        return b;
      });
      setBookings(updated);
      localStorage.setItem('assurx_bookings', JSON.stringify(updated));
    };

    try {
      // Apply local update immediately so UI reflects status change instantly
      applyLocalUpdate();

      const paymentStatus = newStatus === 'report_ready' ? 'paid' : undefined;
      const fetchId = targetBooking?.id ? String(targetBooking.id) : targetId;

      const res = await adminFetch(`/api/admin/bookings/${fetchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'assurx2026health'
        },
        body: JSON.stringify({ bookingStatus: newStatus, paymentStatus })
      });

      if (!res.ok && bookingCode && bookingCode !== fetchId) {
        await adminFetch(`/api/admin/bookings/${bookingCode}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': 'assurx2026health'
          },
          body: JSON.stringify({ bookingStatus: newStatus, paymentStatus })
        });
      }

      showToast(`Successfully updated booking status to "${newStatus.replace(/_/g, ' ')}"!`, 'success');
    } catch (err) {
      console.error("Failed to sync booking status to server, updated locally:", err);
      showToast(`Booking status updated to "${newStatus.replace(/_/g, ' ')}"!`, 'success');
    }
  };

  const handleDeleteBooking = (id: string | number) => {
    triggerConfirm(
      'Cancel & Delete Booking',
      'Are you sure you want to cancel and delete this patient booking record? This will permanently delete the clinical booking log.',
      'Delete Record',
      async () => {
        const idStr = String(id);
        const targetBooking = bookings.find(b => String(b.id) === idStr || b.bookingId === idStr);
        const bookingCode = targetBooking?.bookingId || idStr;

        const updated = bookings.filter(b => String(b.id) !== idStr && b.bookingId !== idStr && b.bookingId !== bookingCode);
        setBookings(updated);
        localStorage.setItem('assurx_bookings', JSON.stringify(updated));

        try {
          const fetchId = targetBooking?.id ? String(targetBooking.id) : idStr;
          const res = await adminFetch(`/api/admin/bookings/${fetchId}`, {
            method: 'DELETE'
          });
          if (!res.ok && bookingCode && bookingCode !== fetchId) {
            await adminFetch(`/api/admin/bookings/${bookingCode}`, {
              method: 'DELETE'
            });
          }
          showToast("Booking record deleted successfully.", 'success');
        } catch (err) {
          console.error("Failed to delete booking on server, deleted locally:", err);
          showToast("Booking record deleted locally.", 'success');
        }
      }
    );
  };

  // Update prescription status
  const handleUpdatePrescriptionStatus = async (prescriptionId: number | string, newStatus: string) => {
    try {
      const res = await adminFetch(`/api/admin/prescriptions/${prescriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'assurx2026health'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = prescriptions.map(p => p.id === prescriptionId ? { ...p, status: newStatus as any } : p);
        setPrescriptions(updated);
        localStorage.setItem('assurx_prescriptions', JSON.stringify(updated));
        showToast(`Successfully marked call as handled!`, 'success');
      } else {
        showToast("Failed to update status on server.", 'error');
      }
    } catch (err) {
      console.error("Failed to update prescription status:", err);
      showToast("Error updating prescription status.", 'error');
    }
  };

  // Delete prescription
  const handleDeletePrescription = (id: number | string) => {
    triggerConfirm(
      'Delete Prescription Lead',
      'Are you sure you want to delete this prescription lead? This action cannot be undone.',
      'Delete Lead',
      async () => {
        try {
          const idStr = String(id);
          const isNumeric = /^\d+$/.test(idStr);
          if (!isNumeric || idStr.startsWith('prx-seed-') || idStr.startsWith('prx-')) {
            // Mock or offline data: remove from state & local storage immediately
            const updated = prescriptions.filter(p => String(p.id) !== idStr);
            setPrescriptions(updated);
            localStorage.setItem('assurx_prescriptions', JSON.stringify(updated));
            showToast("Mock prescription lead deleted.", 'success');
            return;
          }

          const res = await adminFetch(`/api/admin/prescriptions/${idStr}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            const updated = prescriptions.filter(p => String(p.id) !== idStr);
            setPrescriptions(updated);
            localStorage.setItem('assurx_prescriptions', JSON.stringify(updated));
            showToast("Prescription lead deleted successfully.", 'success');
          } else {
            showToast("Failed to delete record on server.", 'error');
          }
        } catch (err) {
          console.error("Failed to delete prescription:", err);
          showToast("Error deleting prescription.", 'error');
        }
      }
    );
  };

  // Open Patient Details Editor
  const handleOpenPatientEditor = (booking: Booking) => {
    setEditingPatientBooking(booking);
    setEditedPatientName(booking.patient.name);
    setEditedPatientAge(booking.patient.age);
    setEditedPatientGender(booking.patient.gender);
    setEditedAppointmentDate(booking.appointmentDate);
    setEditedAppointmentTime(booking.appointmentTime);
    setEditedCollectionType(booking.collectionType);
    setEditedStreet(booking.address?.street || '');
    setEditedCity(booking.address?.city || '');
    setEditedPincode(booking.address?.pincode || '');
  };

  // State & handler for viewing order details (Admin only)
  const [viewingOrderBooking, setViewingOrderBooking] = useState<Booking | null>(null);
  const [viewingReportResults, setViewingReportResults] = useState<any[]>([]);
  const [viewingFindings, setViewingFindings] = useState('');
  const [viewingImpression, setViewingImpression] = useState('');

  const handleOpenViewOrder = (booking: Booking) => {
    setViewingOrderBooking(booking);

    // Check if there is saved clinical data
    const savedCustomResultsStr = localStorage.getItem(`report_data_${booking.id}`);
    if (savedCustomResultsStr) {
      const parsed = JSON.parse(savedCustomResultsStr);
      setViewingReportResults(parsed.parameters || []);
      setViewingFindings(parsed.findings || '');
      setViewingImpression(parsed.impression || '');
    } else {
      const firstLabId = booking.items.find(item => item.itemType === 'service' && item.category === 'lab')?.itemId || '';
      const defaultLabData = INITIAL_LAB_RESULTS[firstLabId] || [
        { parameter: 'Hemoglobin (Hb)', result: '14.5', unit: 'g/dL', range: '13.0 - 17.0', status: 'normal' },
        { parameter: 'Blood Glucose (Fasting)', result: '90', unit: 'mg/dL', range: '70 - 100', status: 'normal' }
      ];
      setViewingReportResults(defaultLabData);
      setViewingFindings("High-resolution diagnostic imaging study of the target physiological zone performed on a premium 3-Tesla digital acquisition framework. Signal characteristics exhibit anatomical harmony with zero evidence of focal pathology, active inflammation, space-occupying neoplasms, or microvascular compromise. Cortical margins are sharp, clear, and perfectly consistent with general clinical metrics.");
      setViewingImpression("NORMAL DIGITAL ACQUISITION STUDY. ZERO STRUCTURAL OR VOLUMETRIC ABNORMALITIES DETECTED.");
    }
  };

  // Save Patient Details changes to backend & local storage
  const handleSavePatientDetails = async () => {
    if (!editingPatientBooking) return;
    const targetId = String(editingPatientBooking.id);
    const targetBookingCode = editingPatientBooking.bookingId;

    const applyLocalUpdate = () => {
      const updated = bookings.map(b => {
        if (String(b.id) === targetId || (targetBookingCode && b.bookingId === targetBookingCode)) {
          return {
            ...b,
            patient: {
              ...b.patient,
              name: editedPatientName,
              age: editedPatientAge,
              gender: editedPatientGender,
            },
            appointmentDate: editedAppointmentDate,
            appointmentTime: editedAppointmentTime,
            collectionType: editedCollectionType,
            address: {
              street: editedStreet,
              city: editedCity,
              pincode: editedPincode,
            }
          };
        }
        return b;
      });
      setBookings(updated);
      localStorage.setItem('assurx_bookings', JSON.stringify(updated));
    };

    try {
      // First apply local update so UI is immediately updated and responsive
      applyLocalUpdate();

      // Try sending update to backend using ID or bookingId endpoint
      const fetchId = targetId || targetBookingCode;
      const res = await adminFetch(`/api/admin/bookings/${fetchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'assurx2026health'
        },
        body: JSON.stringify({
          patientName: editedPatientName,
          patientAge: editedPatientAge,
          patientGender: editedPatientGender,
          patientRelationship: editingPatientBooking.patient.relationship || 'Self',
          appointmentDate: editedAppointmentDate,
          appointmentTime: editedAppointmentTime,
          collectionType: editedCollectionType,
          street: editedStreet,
          city: editedCity,
          pincode: editedPincode,
        })
      });

      if (!res.ok && targetBookingCode && targetBookingCode !== fetchId) {
        // Retry with bookingId if primary ID was numeric/different
        await adminFetch(`/api/admin/bookings/${targetBookingCode}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': 'assurx2026health'
          },
          body: JSON.stringify({
            patientName: editedPatientName,
            patientAge: editedPatientAge,
            patientGender: editedPatientGender,
            patientRelationship: editingPatientBooking.patient.relationship || 'Self',
            appointmentDate: editedAppointmentDate,
            appointmentTime: editedAppointmentTime,
            collectionType: editedCollectionType,
            street: editedStreet,
            city: editedCity,
            pincode: editedPincode,
          })
        });
      }

      setEditingPatientBooking(null);
      showToast('Patient and appointment details updated successfully!', 'success');
    } catch (err) {
      console.error("Failed to save patient details to server, stored locally:", err);
      setEditingPatientBooking(null);
      showToast('Patient details saved successfully!', 'success');
    }
  };

  // Open clinical editor
  const handleOpenClinicalEditor = (booking: Booking) => {
    setEditingBooking(booking);

    // Check if this booking has specific saved custom reports in localStorage
    const savedCustomResultsStr = localStorage.getItem(`report_data_${booking.id}`);
    if (savedCustomResultsStr) {
      const parsed = JSON.parse(savedCustomResultsStr);
      setReportResults(parsed.parameters || []);
      setScanFindings(parsed.findings || '');
      setScanImpression(parsed.impression || '');
    } else {
      // Find a pre-seeded department mock data
      const firstLabId = booking.items.find(item => item.itemType === 'service' && item.category === 'lab')?.itemId || '';
      const defaultLabData = INITIAL_LAB_RESULTS[firstLabId] || [
        { parameter: 'Hemoglobin (Hb)', result: '14.5', unit: 'g/dL', range: '13.0 - 17.0', status: 'normal' },
        { parameter: 'Blood Glucose (Fasting)', result: '90', unit: 'mg/dL', range: '70 - 100', status: 'normal' }
      ];
      setReportResults(defaultLabData);
      setScanFindings("High-resolution diagnostic imaging study of the target physiological zone performed on a premium 3-Tesla digital acquisition framework. Signal characteristics exhibit anatomical harmony with zero evidence of focal pathology, active inflammation, space-occupying neoplasms, or microvascular compromise. Cortical margins are sharp, clear, and perfectly consistent with general clinical metrics.");
      setScanImpression("NORMAL DIGITAL ACQUISITION STUDY. ZERO STRUCTURAL OR VOLUMETRIC ABNORMALITIES DETECTED.");
    }
  };

  // Save clinical test results
  const handleSaveClinicalResults = () => {
    if (!editingBooking) return;

    const payload = {
      parameters: reportResults,
      findings: scanFindings,
      impression: scanImpression
    };

    localStorage.setItem(`report_data_${editingBooking.id}`, JSON.stringify(payload));

    // Automatically transition booking status to report_ready if it is saved!
    handleUpdateStatus(editingBooking.id, 'report_ready');
    setEditingBooking(null);
    showToast(`Clinical reports successfully published and released for Booking ${cleanBookingId(editingBooking.bookingId)}!`, 'success');
  };

  // Update specific lab parameter result row
  const updateResultValue = (index: number, val: string) => {
    const updated = [...reportResults];
    updated[index].result = val;
    setReportResults(updated);
  };

  // Catalog update rate
  const handleStartEditPrice = (service: DiagnosticService) => {
    setEditingServiceId(service.id);
    setEditingPrice(service.price);
    setEditingDiscountPrice(service.discountPrice || service.price);
  };
  const handleSavePrice = async (id: string) => {
    const targetService = services.find(s => s.id === id);
    if (!targetService) return;
    try {
      const updatedFields = { price: editingPrice, discountPrice: editingDiscountPrice };
      const res = await adminFetch(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error("Failed to save price");
      const updated = services.map(s => {
        if (s.id === id) {
          return { ...s, ...updatedFields };
        }
        return s;
      });
      onUpdateServices(updated);
      setEditingServiceId(null);
      showToast('Catalog service pricing adjusted successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to adjust pricing in database.', 'error');
    }
  };

  // Open full edit service modal
  const handleOpenEditService = (service: DiagnosticService) => {
    setEditServiceId(service.id);
    setEditServiceName(service.name);
    setEditServiceCategory(service.category);
    setEditServiceSubCategory(service.subCategory);
    setEditServicePrice(service.price);
    setEditServiceDiscountPrice(service.discountPrice || service.price);
    setEditServiceDescription(service.description);
    setEditServicePreparation(service.preparation);
    setEditServiceDuration(service.duration);
    setEditServiceReportDelivery(service.reportDelivery);
    setEditServicePopular(service.popular || false);
    setIsEditingService(true);
  };

  // Save all edited service fields
  const handleSaveEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editServiceName.trim()) {
      showToast('Service name cannot be empty.', 'error');
      return;
    }
    const updatedFields = {
      name: editServiceName.trim(),
      category: editServiceCategory,
      subCategory: editServiceSubCategory.trim() || (editServiceCategory === 'scan' ? 'General Ultrasound' : 'General Blood Tests'),
      price: editServicePrice,
      discountPrice: editServiceDiscountPrice || undefined,
      description: editServiceDescription.trim(),
      preparation: editServicePreparation.trim(),
      duration: editServiceDuration.trim(),
      reportDelivery: editServiceReportDelivery.trim(),
      popular: editServicePopular
    };
    try {
      const res = await adminFetch(`/api/admin/services/${editServiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error("Failed to save service details");
      const updated = services.map(s => {
        if (s.id === editServiceId) {
          return { ...s, ...updatedFields };
        }
        return s;
      });
      onUpdateServices(updated);
      setIsEditingService(false);
      setEditServiceId(null);
      showToast('Service details updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update service details in database.', 'error');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this service from the catalog? This will also remove it from any configured homepage offering sections.");
    if (confirmDelete) {
      try {
        const res = await adminFetch(`/api/admin/services/${serviceId}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete service");
        const updatedServices = services.filter(s => s.id !== serviceId);
        onUpdateServices(updatedServices);

        if (sections && onUpdateSections) {
          const updatedSections = sections.map(section => {
            if (section.serviceIds && section.serviceIds.includes(serviceId)) {
              return {
                ...section,
                serviceIds: section.serviceIds.filter(id => id !== serviceId)
              };
            }
            return section;
          });
          onUpdateSections(updatedSections);
        }
        showToast('Service deleted from catalog rate-card successfully!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete service from database.', 'error');
      }
    }
  };

  // Handle Manual Walk-in form submit
  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPatientName.trim()) {
      showToast('Please enter patient name.', 'error');
      return;
    }
    if (manualSelectedItems.length === 0) {
      showToast('Please select at least one lab test or scan to book.', 'error');
      return;
    }

    // Map selected item IDs to CartItem format
    const selectedCartItems: CartItem[] = [];
    let priceSum = 0;

    manualSelectedItems.forEach(itemId => {
      const matchS = services.find(s => s.id === itemId);
      if (matchS) {
        selectedCartItems.push({
          itemId: matchS.id,
          itemType: 'service',
          name: matchS.name,
          price: matchS.price,
          discountPrice: matchS.discountPrice,
          category: matchS.category
        });
        priceSum += (matchS.discountPrice || matchS.price);
      } else {
        const matchP = (packages || []).find(p => p.id === itemId);
        if (matchP) {
          selectedCartItems.push({
            itemId: matchP.id,
            itemType: 'package',
            name: matchP.name,
            price: matchP.price,
            discountPrice: matchP.discountPrice
          });
          priceSum += (matchP.discountPrice || matchP.price);
        }
      }
    });

    const taxAmount = Math.round(priceSum * 0.05);
    const collectionFee = manualCollectionType === 'home' ? 150 : 0;
    const finalAmount = priceSum + taxAmount + collectionFee;

    const randomId = Math.floor(100000 + Math.random() * 900000);

    try {
      let token: string | null = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const response = await adminFetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'assurx2026health',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          bookingId: `ASX-${randomId}`,
          patientName: manualPatientName,
          patientAge: parseInt(manualPatientAge) || 35,
          patientGender: manualPatientGender,
          patientRelationship: 'Other',
          appointmentDate: manualDate,
          appointmentTime: manualTime,
          collectionType: manualCollectionType,
          street: manualAddress.trim() || 'AssurX Walk-In Patient Clinic',
          city: manualBranch,
          pincode: manualPincode.trim() || (manualBranch === 'Malad' ? '400064' : '400063'),
          paymentMethod: 'cash_at_center',
          paymentStatus: 'pending',
          bookingStatus: 'booked',
          totalAmount: finalAmount,
          items: selectedCartItems,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save manual booking on server');
      }

      const savedB = await response.json();

      const parsedItems = typeof savedB.items === 'string'
        ? JSON.parse(savedB.items)
        : (Array.isArray(savedB.items) ? savedB.items : []);

      const mappedBooking: Booking = {
        id: String(savedB.id),
        bookingId: savedB.bookingId,
        patient: {
          name: savedB.patientName || (savedB.patient && savedB.patient.name) || '',
          age: savedB.patientAge !== undefined ? savedB.patientAge : (savedB.patient && savedB.patient.age) || 0,
          gender: (savedB.patientGender || (savedB.patient && savedB.patient.gender) || 'Male') as any,
          relationship: (savedB.patientRelationship || (savedB.patient && savedB.patient.relationship) || 'Self') as any
        },
        items: parsedItems,
        appointmentDate: savedB.appointmentDate,
        appointmentTime: savedB.appointmentTime,
        collectionType: savedB.collectionType as any,
        address: {
          street: savedB.street || (savedB.address && savedB.address.street) || '',
          city: savedB.city || (savedB.address && savedB.address.city) || '',
          pincode: savedB.pincode || (savedB.address && savedB.address.pincode) || ''
        },
        paymentMethod: savedB.paymentMethod as any,
        paymentStatus: savedB.paymentStatus as any,
        bookingStatus: savedB.bookingStatus as any,
        totalAmount: savedB.totalAmount,
        timestamp: savedB.timestamp,
        simulatedReportUrl: savedB.simulatedReportUrl || `/reports/ASX-${randomId}.pdf`
      };

      const newBookingsList = [mappedBooking, ...bookings];
      setBookings(newBookingsList);
      localStorage.setItem('assurx_bookings', JSON.stringify(newBookingsList));

      // Reset Form
      setManualPatientName('');
      setManualSelectedItems([]);
      setManualAddress('');
      setManualPincode('');
      showToast(`Success! Manual Walk-In Order Created. Booking ID: ASX-${randomId}`, 'success');
      setActiveTab('dispatcher');
    } catch (error) {
      console.error("Failed to sync manual walk-in:", error);
      showToast("Failed to synchronize manual walk-in with the backend.", 'error');
    }
  };

  const toggleManualItemSelection = (id: string) => {
    if (manualSelectedItems.includes(id)) {
      setManualSelectedItems(manualSelectedItems.filter(i => i !== id));
    } else {
      setManualSelectedItems([...manualSelectedItems, id]);
    }
  };

  // Filter dispatch lists
  const filteredBookings = bookings.filter(b => {
    // Hide Mock Data if enabled
    if (hideMockData && b.id.startsWith('b-admin-')) {
      return false;
    }

    // Branch match
    const bCity = b.address?.city || 'Malad';
    const matchesBranch = selectedBranchFilter === 'All' || bCity.toLowerCase() === selectedBranchFilter.toLowerCase();

    // Status match
    const matchesStatus = selectedStatusFilter === 'All' || b.bookingStatus === selectedStatusFilter;

    // Search query match (patient name or booking ID)
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query ||
      b.patient.name.toLowerCase().includes(query) ||
      b.bookingId.toLowerCase().includes(query) ||
      b.items.some(it => it.name.toLowerCase().includes(query));

    return matchesBranch && matchesStatus && matchesSearch;
  });

  // Analytics helper metrics
  const totalGrossRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalBookingsCount = bookings.length;

  const maladBookings = bookings.filter(b => (b.address?.city || '').toLowerCase() === 'malad');
  const maladRevenue = maladBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const goregaonBookings = bookings.filter(b => (b.address?.city || '').toLowerCase() === 'goregaon');
  const goregaonRevenue = goregaonBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const statusCounts = {
    booked: bookings.filter(b => b.bookingStatus === 'booked').length,
    sample_collected: bookings.filter(b => b.bookingStatus === 'sample_collected').length,
    processing: bookings.filter(b => b.bookingStatus === 'processing').length,
    report_ready: bookings.filter(b => b.bookingStatus === 'report_ready').length,
    no_show: bookings.filter(b => b.bookingStatus === 'no_show').length,
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-20 px-4">
        <div className="bg-white border border-slate-200 shadow-xl rounded-[32px] p-8 space-y-6 text-center relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 inset-x-0 h-2 bg-emerald-600"></div>

          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[9px] font-black tracking-widest text-emerald-750 uppercase block">Restricted System Access</span>
            <h2 className="text-2xl font-serif font-light text-slate-900">Clinical <span className="italic font-medium text-emerald-800">Admin Gate</span></h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              This terminal is strictly reserved for certified laboratory technicians, pathologists, and radiologists.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Admin Email Address</label>
              <input
                type="email"
                required
                disabled={lockUntil > Date.now()}
                placeholder="admin@assurx.com"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:outline-none font-sans font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Password</label>
              <input
                type="password"
                required
                disabled={lockUntil > Date.now()}
                placeholder="••••••••"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:outline-none font-sans font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Security Key Access Code</label>
              <input
                type="password"
                required
                disabled={lockUntil > Date.now()}
                placeholder="••••••••"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:outline-none font-sans font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-150">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={lockUntil > Date.now()}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <span>Verify & Connect</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setCurrentTab('home')}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-450 hover:text-slate-800 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </button>
          </div>


        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-8 animate-fade-in text-left">

      {/* Enterprise Admin Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-150 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] uppercase tracking-widest font-bold rounded-md">
              Security Group: Admin
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
              {isSyncing ? 'Syncing Database...' : 'Live Synced'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">
            AssurX <span className="italic font-medium text-emerald-800">Admin Console</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Secure multi-branch monitoring, manual order registration, custom diagnostic reporting, and analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDatabaseData(false)}
            disabled={isSyncing}
            className={`px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-full flex items-center gap-1.5 transition-colors cursor-pointer ${isSyncing ? 'bg-slate-100 opacity-80' : 'bg-white hover:bg-slate-50'}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </button>

          <button
            onClick={() => {
              triggerConfirm(
                'Secure Database Reset',
                'Are you sure you want to securely reset and clear all patient bookings and prescription records in the database? This action will permanently wipe the live database.',
                'Wipe & Reset Live Data',
                async () => {
                  try {
                    const res = await adminFetch('/api/admin/reset', {
                      method: 'POST'
                    });
                    if (res.ok) {
                      localStorage.removeItem('assurx_bookings');
                      localStorage.removeItem('assurx_prescriptions');
                      localStorage.removeItem('assurx_services');
                      setBookings([]);
                      setPrescriptions([]);
                      // Re-fetch services from MongoDB after reset
                      try {
                        const svcRes = await fetch('/api/services');
                        if (svcRes.ok) {
                          const freshServices = await svcRes.json();
                          onUpdateServices(freshServices);
                        }
                      } catch (refetchErr) {
                        console.error('Error re-fetching services after reset:', refetchErr);
                      }
                      showToast('All patient data and prescriptions have been securely wiped and reset in the live database!', 'success');
                    } else {
                      showToast('Failed to securely clear the database on the server.', 'error');
                    }
                  } catch (err) {
                    console.error('Error resetting database:', err);
                    showToast('Error resetting live database.', 'error');
                  }
                }
              );
            }}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Database</span>
          </button>

          <button
            onClick={() => setCurrentTab('home')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-md shadow-emerald-100 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </button>

          <button
            onClick={async () => {
              // Invalidate the active session on the server
              try {
                await adminFetch('/api/admin/logout', {
                  method: 'POST'
                });
              } catch (_) { /* fire and forget */ }
              // Clear local state
              setIsAdminAuthenticated(false);
              localStorage.removeItem('assurx_admin_auth');
              localStorage.removeItem('adminSession');
              localStorage.removeItem('adminEmail');
              localStorage.removeItem('adminKey');
              sessionStorage.removeItem('assurx_admin_auth');
              showToast('Logged out of Admin Console successfully.', 'info');
            }}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* KPI 1 */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total bookings</span>
            <span className="text-3xl font-serif font-bold text-slate-800">{totalBookingsCount} Orders</span>
            <span className="block text-[10.5px] text-slate-500 font-semibold">Malad: {maladBookings.length} | Goregaon: {goregaonBookings.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Gross Revenue</span>
            <span className="text-3xl font-serif font-bold text-emerald-800">₹{totalGrossRevenue.toLocaleString('en-IN')}</span>
            <span className="block text-[10.5px] text-slate-500 font-semibold">Dual branch consolidated</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Malad Branch</span>
            <span className="text-2xl font-serif font-bold text-slate-800">₹{maladRevenue.toLocaleString('en-IN')}</span>
            <span className="block text-[10.5px] text-slate-500 font-semibold">{maladBookings.length} Patients registered</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Goregaon Branch</span>
            <span className="text-2xl font-serif font-bold text-slate-800">₹{goregaonRevenue.toLocaleString('en-IN')}</span>
            <span className="block text-[10.5px] text-slate-500 font-semibold">{goregaonBookings.length} Patients registered</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Admin Module Panel Navigation */}
      <div className="flex flex-wrap border-b border-gray-200 gap-6 text-xs font-bold uppercase tracking-widest text-slate-400 pb-0.5">
        <button
          onClick={() => setActiveTab('dispatcher')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'dispatcher' ? 'text-emerald-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <ClipboardList className="w-4 h-4 text-emerald-600" />
          <span>Orders Dispatcher ({filteredBookings.length})</span>
          {activeTab === 'dispatcher' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => {
            setActiveTab('prescriptions');
            setSelectedLeadFilter('camps');
          }}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'prescriptions' && selectedLeadFilter === 'camps' ? 'text-purple-900 font-black' : 'hover:text-purple-800 text-purple-700 font-extrabold'
            }`}
        >
          <Tent className="w-4 h-4 text-purple-600" />
          <span>⛺ Health Camp Applications ({prescriptions.filter(p => p.prescriptionId?.startsWith('CAMP') || p.patientName?.includes('[CAMP]') || p.fileName?.includes('Camp')).length})</span>
          {activeTab === 'prescriptions' && selectedLeadFilter === 'camps' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => {
            setActiveTab('prescriptions');
            setSelectedLeadFilter('all');
          }}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'prescriptions' && selectedLeadFilter !== 'camps' ? 'text-teal-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <FileText className="w-4 h-4 text-teal-600" />
          <span>Prescription Consults & Leads ({prescriptions.length})</span>
          {activeTab === 'prescriptions' && selectedLeadFilter !== 'camps' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'manual' ? 'text-emerald-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Manual Walk-in Order</span>
          {activeTab === 'manual' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'catalog' ? 'text-emerald-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <Settings className="w-4 h-4 text-slate-550" />
          <span>Catalog & Pricing Manager</span>
          {activeTab === 'catalog' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'packages' ? 'text-purple-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <ClipboardList className="w-4 h-4 text-purple-600" />
          <span>Health Packages ({packages.length})</span>
          {activeTab === 'packages' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'analytics' ? 'text-emerald-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <TrendingUp className="w-4 h-4 text-cyan-600" />
          <span>Branch Analytics</span>
          {activeTab === 'analytics' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('careers')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'careers' ? 'text-teal-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <Briefcase className="w-4 h-4 text-teal-650" />
          <span>Job Applications ({applications.length})</span>
          {activeTab === 'careers' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'sections' ? 'text-emerald-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <LayoutGrid className="w-4 h-4 text-emerald-650" />
          <span>Homepage Sections ({sections.length})</span>
          {activeTab === 'sections' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'branches' ? 'text-emerald-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <Building className="w-4 h-4 text-emerald-655" />
          <span>Branches Settings ({centers.length})</span>
          {activeTab === 'branches' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'doctors' ? 'text-teal-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <UserCheck className="w-4 h-4 text-teal-650" />
          <span>Doctors Directory ({doctors.length})</span>
          {activeTab === 'doctors' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 rounded-full"></span>}
        </button>

        <button
          onClick={() => {
            const stored = JSON.parse(localStorage.getItem('assurx_complaints') || '[]');
            setComplaints(stored);
            setActiveTab('complaints');
          }}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'complaints' ? 'text-amber-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <MessageSquareWarning className="w-4 h-4 text-amber-600" />
          <span>Patient Complaints ({complaints.length})</span>
          {activeTab === 'complaints' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full"></span>}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 cursor-pointer ${activeTab === 'security' ? 'text-emerald-800 font-black' : 'hover:text-slate-700'
            }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-650" />
          <span>Security Settings</span>
          {activeTab === 'security' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full"></span>}
        </button>
      </div>

      {/* Main Panel Content Render Area */}
      <div className="pt-2">

        {/* Tab 1: Dispatcher and booking manager */}
        {activeTab === 'dispatcher' && (
          <div className="space-y-6">

            {/* Filter controls row */}
            <div className="bg-[#fcfcfb] border border-gray-200 p-4 rounded-3xl flex flex-col md:flex-row justify-between gap-4 items-center">

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                {/* Branch selector filter */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-550">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Branch:</span>
                  <select
                    value={selectedBranchFilter}
                    onChange={(e) => setSelectedBranchFilter(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Mumbai Branches</option>
                    <option value="Malad">Malad Branch</option>
                    <option value="Goregaon">Goregaon Branch</option>
                  </select>
                </div>

                {/* Status selector filter */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-550">
                  <span>Status:</span>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="booked">Booking Confirmed</option>
                    <option value="sample_collected">Sample Collected</option>
                    <option value="processing">Processing in Lab</option>
                    <option value="report_ready">Report Released</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>

                {/* Live submissions filter checkbox */}
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-550 cursor-pointer select-none bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100/40 px-2 py-1 rounded-lg">
                  <input
                    type="checkbox"
                    checked={hideMockData}
                    onChange={(e) => setHideMockData(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-650 focus:ring-emerald-600 cursor-pointer"
                  />
                  <span>Live Submissions Only</span>
                </label>
              </div>

              {/* Patient Search */}
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, ID, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                />
              </div>

            </div>

            {/* List Table of Patient Orders */}
            {filteredBookings.length === 0 ? (
              <div className="py-16 text-center bg-white border border-gray-200 rounded-3xl text-slate-450">
                No active patient bookings match the selected branch/status/search criteria.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-gray-200 text-slate-450 font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-4.5 px-5">ID / Patient</th>
                        <th className="py-4.5 px-4">Appointment details</th>
                        <th className="py-4.5 px-4">Branch</th>
                        <th className="py-4.5 px-4">Items Booked</th>
                        <th className="py-4.5 px-4">Total Price</th>
                        <th className="py-4.5 px-4">Status</th>
                        <th className="py-4.5 px-5 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-slate-700">
                      {filteredBookings.map((booking) => {
                        const bBranch = booking.address?.city || 'Malad';
                        const isReportReady = booking.bookingStatus === 'report_ready';

                        return (
                          <tr key={booking.id} className="hover:bg-slate-50/40 transition-colors">

                            {/* Column 1 */}
                            <td className="py-4 px-5">
                              <div className="space-y-0.5">
                                <span className="font-mono text-[10px] text-emerald-700 font-bold tracking-wider uppercase block">
                                  {cleanBookingId(booking.bookingId)}
                                </span>
                                <span className="font-bold text-slate-900 text-sm block">
                                  {booking.patient.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-semibold">
                                  {booking.patient.age} yrs • {booking.patient.gender}
                                </span>
                              </div>
                            </td>

                            {/* Column 2 */}
                            <td className="py-4 px-4">
                              <div className="space-y-1 font-semibold text-slate-650">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{booking.appointmentDate}</span>
                                </div>
                                <span className="text-[10.5px] text-slate-500 block">
                                  {booking.appointmentTime.split(' (')[0]}
                                </span>
                                <span className="text-[9.5px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                                  {booking.collectionType === 'home' ? '🏠 Home Coll' : '🏢 Center'}
                                </span>
                              </div>
                            </td>

                            {/* Column 3 */}
                            <td className="py-4 px-4 font-bold text-slate-800">
                              <div className="flex items-center gap-1 text-xs">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span>{bBranch} Branch</span>
                              </div>
                            </td>

                            {/* Column 4 */}
                            <td className="py-4 px-4 max-w-[200px]">
                              <div className="space-y-0.5">
                                {booking.items.map((item, index) => (
                                  <div key={index} className="text-[11px] font-semibold text-slate-700 truncate" title={item.name}>
                                    • {item.name}
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Column 5 */}
                            <td className="py-4 px-4">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-950 font-serif">₹{booking.totalAmount}</span>
                                <span className={`text-[9px] font-bold uppercase block ${booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-500'
                                  }`}>
                                  {booking.paymentStatus === 'paid' ? '● Paid' : '● Cash / Pending'}
                                </span>
                              </div>
                            </td>

                            {/* Column 6 */}
                            <td className="py-4 px-4">
                              <select
                                value={booking.bookingStatus}
                                onChange={(e) => handleUpdateStatus(booking.id, e.target.value as any)}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-[10.5px] border cursor-pointer focus:outline-none ${booking.bookingStatus === 'booked' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  booking.bookingStatus === 'sample_collected' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    booking.bookingStatus === 'processing' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                      booking.bookingStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200 font-extrabold' :
                                        booking.bookingStatus === 'no_show' ? 'bg-orange-50 text-orange-700 border-orange-200 font-extrabold' :
                                          'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                              >
                                <option value="booked">Confirmed</option>
                                <option value="sample_collected">Sample Collected</option>
                                <option value="processing">In Lab Processing</option>
                                <option value="report_ready">Report Released</option>
                                <option value="no_show">No Show</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>

                            {/* Column 7 */}
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenViewOrder(booking)}
                                  className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-850 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  title="View Full Order Details"
                                >
                                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                                  <span>View Order</span>
                                </button>

                                <button
                                  onClick={() => handleOpenPatientEditor(booking)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  title="Edit Patient Details"
                                >
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Edit Patient</span>
                                </button>

                                <button
                                  onClick={() => handleOpenClinicalEditor(booking)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  title="Enter Test Results"
                                >
                                  <Edit2 className="w-3 h-3 text-slate-500" />
                                  <span>{isReportReady ? 'Edit Findings' : 'Publish Report'}</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteBooking(booking.id)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel Appointment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Manual Booking walks / phone orders */}
        {activeTab === 'manual' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 max-w-3xl mx-auto shadow-sm">

            <div className="border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-xl font-serif font-light text-slate-900">
                Manual Patient <span className="italic font-medium text-emerald-800">Order Booking</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Register walk-in clinic patients or phone bookings to Goregaon / Malad branches directly.</p>
            </div>

            <form onSubmit={handleManualBookingSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Patient Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Ramesh Chandra Sharma"
                    value={manualPatientName}
                    onChange={(e) => setManualPatientName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>

                {/* Patient Age */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={manualPatientAge}
                    onChange={(e) => setManualPatientAge(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                  <select
                    value={manualPatientGender}
                    onChange={(e) => setManualPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Dispatch Branch */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Branch Location</label>
                  <select
                    value={manualBranch}
                    onChange={(e) => setManualBranch(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    <option value="Malad">Malad West Branch</option>
                    <option value="Goregaon">Goregaon Branch</option>
                  </select>
                </div>

                {/* Collection type */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sample Collection</label>
                  <select
                    value={manualCollectionType}
                    onChange={(e) => setManualCollectionType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    <option value="center">🏢 Walk-in at Branch Center</option>
                    <option value="home">🏠 Sterile Home Collection (+₹150)</option>
                  </select>
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Appointment Time Slot</label>
                  <select
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  >
                    <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Address / Comments (For Home collection) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient Street Address</label>
                  <input
                    type="text"
                    placeholder="House/Plot/Apartment No, Landmark"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                  <input
                    type="text"
                    placeholder="6 Digits"
                    maxLength={6}
                    value={manualPincode}
                    onChange={(e) => setManualPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Select Diagnostic Items portfolio */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Diagnostic Items & Packages</label>
                <div className="border border-slate-200 rounded-2xl max-h-48 overflow-y-auto p-4 space-y-2 bg-slate-50/50">

                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Popular Packages</div>
                  {(packages || []).map(pkg => (
                    <label key={pkg.id} className="flex items-center gap-2.5 py-1 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={manualSelectedItems.includes(pkg.id)}
                        onChange={() => toggleManualItemSelection(pkg.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-850">{pkg.name}</span>
                      <span className="text-slate-450 text-[10.5px]">({pkg.testsCount} Tests included) • ₹{pkg.discountPrice || pkg.price}</span>
                    </label>
                  ))}

                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-200/60 mt-1">Diagnostic Services (MRI, Blood Tests)</div>
                  {services.map(srv => (
                    <label key={srv.id} className="flex items-center gap-2.5 py-1 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={manualSelectedItems.includes(srv.id)}
                        onChange={() => toggleManualItemSelection(srv.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-850">[{srv.category.toUpperCase()}] {srv.name}</span>
                      <span className="text-slate-450 text-[10.5px]">• ₹{srv.discountPrice || srv.price}</span>
                    </label>
                  ))}

                </div>
              </div>

              {/* Action submit button */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Manual Order</span>
              </button>

            </form>
          </div>
        )}

        {/* Tab 3: Catalog and Pricing management */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">

            {/* Header / Search Catalog */}
            <div className="bg-[#fcfcfb] border border-gray-200 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Services Catalog Rate-Card</h3>
                <p className="text-[11px] text-slate-400">Toggle active test directories and manage special subsidy prices instantly.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsAddingService(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Service</span>
                </button>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search catalog items..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Add New Service Form Section */}
            {isAddingService && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-850 text-xs md:text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Create New Diagnostic Service</span>
                  </h4>
                  <button
                    onClick={() => setIsAddingService(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddServiceSubmit} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Service Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MRI Brain With Contrast, Lipid Profile"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Category (Department)</label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => {
                          setNewServiceCategory(e.target.value as 'scan' | 'lab');
                          setNewServiceSubCategory(''); // reset
                        }}
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold cursor-pointer"
                      >
                        <option value="scan">Imaging (Radiology / Scans)</option>
                        <option value="lab">Pathology (Blood / Urine Tests)</option>
                      </select>
                    </div>
                    {/* Sub Category */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sub Category</label>
                      <input
                        type="text"
                        placeholder={newServiceCategory === 'scan' ? 'e.g. MRI Scans, CT Scans, Ultrasound' : 'e.g. Thyroid, Diabetic Profiles, Vitamins'}
                        value={newServiceSubCategory}
                        onChange={(e) => setNewServiceSubCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Standard Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Standard Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    {/* Special Discount Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Discount Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={newServiceDiscountPrice}
                        onChange={(e) => setNewServiceDiscountPrice(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    {/* Duration */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Scan/Test Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 20-30 mins, 5 mins"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    {/* Report Delivery */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Report Delivery Time</label>
                      <input
                        type="text"
                        placeholder="e.g. Same Day, Within 2 Hours, 24 Hours"
                        value={newServiceReportDelivery}
                        onChange={(e) => setNewServiceReportDelivery(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Clinical Description</label>
                      <textarea
                        rows={2}
                        placeholder="Detail the clinical significance and use of this scan or blood test..."
                        value={newServiceDescription}
                        onChange={(e) => setNewServiceDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold resize-none"
                      />
                    </div>
                    {/* Preparation */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preparation Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. 10-12 hours fasting mandatory, avoid metallic jewelry..."
                        value={newServicePreparation}
                        onChange={(e) => setNewServicePreparation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newServicePopular}
                        onChange={(e) => setNewServicePopular(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mark as Popular / Feature on Homepage</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingService(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer"
                      >
                        Create & Add Service
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* List Table of Catalog */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-4 px-5">Department</th>
                      <th className="py-4 px-4">Service / Lab Test Name</th>
                      <th className="py-4 px-4">Standard Price</th>
                      <th className="py-4 px-4">Special Discount Price</th>
                      <th className="py-4 px-4">Clinical Preparation Required</th>
                      <th className="py-4 px-5 text-right">Catalog Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-slate-700 font-semibold">
                    {services.filter(s => s.name.toLowerCase().includes(catalogSearch.toLowerCase())).map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50/40">
                        <td className="py-3.5 px-5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${srv.category === 'scan' ? 'bg-indigo-50 text-indigo-750' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                            {srv.category === 'scan' ? 'Imaging (Radiology)' : 'Pathology (Lab)'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 text-sm font-bold">{srv.name}</td>

                        {/* Pricing column */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-500 font-mono">₹{srv.price}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-emerald-700 font-bold font-serif">₹{srv.discountPrice || srv.price}</span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{srv.preparation}</td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleOpenEditService(srv)}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteService(srv.id)}
                              className="px-2.5 py-1.5 border border-slate-200 hover:border-rose-350 hover:bg-rose-50 hover:text-rose-700 text-slate-550 font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3 h-3 text-slate-400" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Full Edit Service Modal */}
        {isEditingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsEditingService(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 border border-gray-200" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900">Edit Service Details</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Modify pricing, clinical preparation, delivery times and all other attributes.</p>
                </div>
                <button
                  onClick={() => setIsEditingService(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveEditService} className="px-7 py-6 space-y-5">
                {/* Row 1: Name + Category + Sub Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Service Name</label>
                    <input
                      type="text"
                      required
                      value={editServiceName}
                      onChange={(e) => setEditServiceName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Category</label>
                    <select
                      value={editServiceCategory}
                      onChange={(e) => setEditServiceCategory(e.target.value as 'scan' | 'lab')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    >
                      <option value="scan">Imaging (Radiology)</option>
                      <option value="lab">Pathology (Lab)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sub Category</label>
                    <input
                      type="text"
                      placeholder={editServiceCategory === 'scan' ? 'e.g. MRI Scans, CT Scans' : 'e.g. Thyroid, Diabetic Profiles'}
                      value={editServiceSubCategory}
                      onChange={(e) => setEditServiceSubCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Row 2: Pricing + Duration + Report Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Standard Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editServicePrice}
                      onChange={(e) => setEditServicePrice(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Discount Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={editServiceDiscountPrice}
                      onChange={(e) => setEditServiceDiscountPrice(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Scan/Test Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 20-30 mins"
                      value={editServiceDuration}
                      onChange={(e) => setEditServiceDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Report Delivery Time</label>
                    <input
                      type="text"
                      placeholder="e.g. Same Day, 24 Hours"
                      value={editServiceReportDelivery}
                      onChange={(e) => setEditServiceReportDelivery(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Row 3: Description + Preparation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Clinical Description</label>
                    <textarea
                      rows={3}
                      placeholder="Detail the clinical significance and use of this scan or blood test..."
                      value={editServiceDescription}
                      onChange={(e) => setEditServiceDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preparation Instructions</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. 10-12 hours fasting mandatory, avoid metallic jewelry..."
                      value={editServicePreparation}
                      onChange={(e) => setEditServicePreparation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold resize-none"
                    />
                  </div>
                </div>

                {/* Row 4: Popular + Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editServicePopular}
                      onChange={(e) => setEditServicePopular(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Mark as Popular / Feature on Homepage</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingService(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 8.5: Health Packages Manager */}
        {activeTab === 'packages' && (
          <div className="space-y-6">

            {/* Header / Search Packages */}
            <div className="bg-[#fcfcfb] border border-gray-200 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Health Checkup Packages</h3>
                <p className="text-[11px] text-slate-400">Manage comprehensive medical panels, ideal age groups, fasting/prep rules and pricing.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsAddingPackage(true);
                    setEditingPackageId(null);
                    setPkgName('');
                    setPkgPrice('1500');
                    setPkgDiscountPrice('690');
                    setPkgDescription('');
                    setPkgTestsCount('10');
                    setPkgIncludedTests('');
                    setPkgIdealFor('Men & Women, 18-80 years');
                    setPkgFrequency('Once in 6 months');
                    setPkgPreparation('8-12 hours fasting required');
                    setPkgPopular(false);
                  }}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Package</span>
                </button>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search health packages..."
                    value={pkgSearch}
                    onChange={(e) => setPkgSearch(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Add / Edit Package Form Section */}
            {(isAddingPackage || editingPackageId) && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-850 text-xs md:text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-purple-600" />
                    <span>{editingPackageId ? 'Edit Health Package' : 'Create New Health Package'}</span>
                  </h4>
                  <button
                    onClick={() => {
                      setIsAddingPackage(false);
                      setEditingPackageId(null);
                    }}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={editingPackageId ? handleEditPackageSubmit : handleAddPackageSubmit} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Package Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AssurX Fever Profile, Sugar Plus"
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                      />
                    </div>
                    {/* Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Original Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={pkgPrice}
                        onChange={(e) => setPkgPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                      />
                    </div>
                    {/* Discount Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Offer/Discount Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={pkgDiscountPrice}
                        onChange={(e) => setPkgDiscountPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tests Count */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Tests Included Count *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={pkgTestsCount}
                        onChange={(e) => setPkgTestsCount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                      />
                    </div>
                    {/* Ideal For */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Ideal For *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Men & Women, 18-80 years"
                        value={pkgIdealFor}
                        onChange={(e) => setPkgIdealFor(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                      />
                    </div>
                    {/* Frequency */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Recommended Frequency *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Once in 6 months, Once a year"
                        value={pkgFrequency}
                        onChange={(e) => setPkgFrequency(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Included Tests (comma separated) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Included Tests (Comma separated list) *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. Complete Blood Count (CBC), Fasting Blood Sugar (FBS), Lipid Panel, Serum Creatinine"
                        value={pkgIncludedTests}
                        onChange={(e) => setPkgIncludedTests(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold resize-none"
                      />
                    </div>
                    {/* Preparation */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preparation Instructions *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. 8-12 hours fasting required, morning sample preferred"
                        value={pkgPreparation}
                        onChange={(e) => setPkgPreparation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold resize-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Clinical Description *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Comprehensive screening for metabolic disorders, organ function, sugar profiles and blood markers."
                      value={pkgDescription}
                      onChange={(e) => setPkgDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold resize-none"
                    />
                  </div>

                  {/* Popular checkbox and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pkgPopular}
                        onChange={(e) => setPkgPopular(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Mark as bestseller / Feature on Homepage</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingPackage(false);
                          setEditingPackageId(null);
                        }}
                        className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-purple-100 cursor-pointer"
                      >
                        {editingPackageId ? 'Save Changes' : 'Create Package'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Packages List cards layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages
                .filter(p => !pkgSearch || p.name.toLowerCase().includes(pkgSearch.toLowerCase()))
                .map(pkg => (
                  <div key={pkg.id} className="bg-white border border-gray-200 p-5 rounded-3xl flex flex-col justify-between hover:shadow-md transition-all text-left">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          {pkg.popular && (
                            <span className="bg-purple-100 text-purple-700 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full block w-max mb-1.5">
                              Bestseller Checkup
                            </span>
                          )}
                          <h4 className="font-bold text-slate-800 text-sm">{pkg.name}</h4>
                          <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">{pkg.testsCount} Tests Included</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-800 block">₹{pkg.discountPrice || pkg.price}</span>
                          {pkg.discountPrice && (
                            <span className="text-[10px] text-slate-400 line-through block">₹{pkg.price}</span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">{pkg.description}</p>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5 text-[10px] text-slate-655 font-semibold">
                        <div><span className="font-bold text-slate-500">Ideal For:</span> {pkg.idealFor}</div>
                        <div><span className="font-bold text-slate-500">Preparation:</span> {pkg.preparation}</div>
                        <div><span className="font-bold text-slate-500">Frequency:</span> {pkg.frequency}</div>
                        <div><span className="font-bold text-slate-500">Tests:</span> <span className="line-clamp-2">{pkg.includedTests.join(', ')}</span></div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-slate-100 pt-3 mt-4">
                      <button
                        onClick={() => {
                          setEditingPackageId(pkg.id);
                          setPkgName(pkg.name);
                          setPkgPrice(pkg.price.toString());
                          setPkgDiscountPrice(pkg.discountPrice?.toString() || '');
                          setPkgDescription(pkg.description);
                          setPkgTestsCount(pkg.testsCount.toString());
                          setPkgIncludedTests(pkg.includedTests.join(', '));
                          setPkgIdealFor(pkg.idealFor);
                          setPkgFrequency(pkg.frequency);
                          setPkgPreparation(pkg.preparation);
                          setPkgPopular(!!pkg.popular);
                          setIsAddingPackage(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="px-3.5 py-1.5 border border-rose-100 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 4: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Branch performance visual */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-serif font-light text-slate-900">Branch <span className="italic font-medium text-emerald-800">Operational Share</span></h4>
                  <p className="text-xs text-slate-500 mt-1">Comparison of booking and patient volumes between Malad and Goregaon branches.</p>
                </div>

                <div className="space-y-6 py-6">
                  {/* Malad */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-emerald-600 rounded-full"></span>
                        Malad West Branch ({maladBookings.length} bookings)
                      </span>
                      <span>₹{maladRevenue.toLocaleString('en-IN')} ({Math.round(totalGrossRevenue ? (maladRevenue / totalGrossRevenue) * 100 : 0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalBookingsCount ? (maladBookings.length / totalBookingsCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Goregaon */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                        Goregaon Branch ({goregaonBookings.length} bookings)
                      </span>
                      <span>₹{goregaonRevenue.toLocaleString('en-IN')} ({Math.round(totalGrossRevenue ? (goregaonRevenue / totalGrossRevenue) * 100 : 0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${totalBookingsCount ? (goregaonBookings.length / totalBookingsCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-800">Operational Insight:</span> Malad currently holds {Math.round(totalBookingsCount ? (maladBookings.length / totalBookingsCount) * 100 : 0)}% of the patient dispatcher share, mainly driven by home collection diagnostics.
                </div>
              </div>

              {/* Status processing visual queue */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-serif font-light text-slate-900">Lab Processing <span className="italic font-medium text-emerald-800">Funnel Status</span></h4>
                  <p className="text-xs text-slate-500 mt-1">Real-time breakdown of current workflows inside medical processing centers.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">1. Booked & Confirmed</span>
                    <span className="text-2xl font-serif font-bold text-emerald-800 mt-1 block">{statusCounts.booked} patients</span>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">2. Sample Collected</span>
                    <span className="text-2xl font-serif font-bold text-amber-700 mt-1 block">{statusCounts.sample_collected} phlebotomies</span>
                  </div>
                  <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">3. In Lab Processing</span>
                    <span className="text-2xl font-serif font-bold text-purple-700 mt-1 block">{statusCounts.processing} tests</span>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">4. Report Released</span>
                    <span className="text-2xl font-serif font-bold text-emerald-800 mt-1 block">{statusCounts.report_ready} patients</span>
                  </div>
                  <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold uppercase text-slate-400">⚠ No Show</span>
                    <span className="text-2xl font-serif font-bold text-orange-700 mt-1 block">{statusCounts.no_show} patients</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-450 leading-relaxed">
                  Dual-branch laboratories process pathology bio-markers with a 12-hour average turnaround time.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 5: Prescription Consultations & Callback Leads */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#fcfcfb] border border-gray-200 p-4 rounded-3xl flex flex-col md:flex-row justify-between gap-4 items-center">
              <div>
                <span className="text-[10px] font-black text-teal-800 tracking-wider uppercase block">Patient Prescriptions & Health Camp Leads</span>
                <p className="text-xs text-slate-500">View real-time doctor prescription files, housing society camp applications, and callback requests.</p>
              </div>
              <button
                onClick={() => {
                  triggerConfirm(
                    'Clear Lead Logs',
                    'Are you sure you want to clear all lead and camp application records from your view?',
                    'Clear Logs',
                    () => {
                      localStorage.removeItem('assurx_prescriptions');
                      setPrescriptions([]);
                      showToast('Lead logs cleared.', 'success');
                    }
                  );
                }}
                className="px-3.5 py-1.5 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                Clear Lead Logs
              </button>
            </div>

            {/* Quick Filter Pills for Admin */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Filter Leads:</span>
              <button
                onClick={() => setSelectedLeadFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedLeadFilter === 'all'
                    ? 'bg-[#2D006B] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Leads ({prescriptions.length})
              </button>
              <button
                onClick={() => setSelectedLeadFilter('camps')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLeadFilter === 'camps'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Tent className="w-3.5 h-3.5" />
                <span>⛺ Health Camp Applications ({prescriptions.filter(p => p.prescriptionId?.startsWith('CAMP') || p.patientName?.includes('[CAMP]') || p.fileName?.includes('Camp')).length})</span>
              </button>
              <button
                onClick={() => setSelectedLeadFilter('prescriptions')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedLeadFilter === 'prescriptions'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                }`}
              >
                Doctor Prescriptions ({prescriptions.filter(p => !p.prescriptionId?.startsWith('CAMP') && !p.patientName?.includes('Quick Callback')).length})
              </button>
              <button
                onClick={() => setSelectedLeadFilter('callbacks')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedLeadFilter === 'callbacks'
                    ? 'bg-rose-700 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                Quick Callbacks ({prescriptions.filter(p => p.patientName?.includes('Quick Callback')).length})
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="py-16 text-center bg-white border border-gray-200 rounded-3xl text-slate-450 font-bold">
                No patient prescriptions or camp applications registered.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-gray-200 text-slate-450 font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-4.5 px-5">Lead ID / Applicant Name</th>
                        <th className="py-4.5 px-4">Contact Phone</th>
                        <th className="py-4.5 px-4">Lead Type / File</th>
                        <th className="py-4.5 px-4">Category</th>
                        <th className="py-4.5 px-4">Extracted Details / Notes</th>
                        <th className="py-4.5 px-4">Status</th>
                        <th className="py-4.5 px-5 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-slate-700 font-semibold">
                      {prescriptions
                        .filter(prx => {
                          const isCamp = prx.prescriptionId?.startsWith('CAMP') || prx.patientName?.includes('[CAMP]') || prx.fileName?.includes('Camp');
                          const isCallback = prx.patientName?.includes('Quick Callback');
                          const isRx = !isCamp && !isCallback;
                          if (selectedLeadFilter === 'camps') return isCamp;
                          if (selectedLeadFilter === 'prescriptions') return isRx;
                          if (selectedLeadFilter === 'callbacks') return isCallback;
                          return true;
                        })
                        .map((prx) => {
                          const isCamp = prx.prescriptionId?.startsWith('CAMP') || prx.patientName?.includes('[CAMP]') || prx.fileName?.includes('Camp');
                          return (
                            <tr key={prx.id || prx.prescriptionId} className={`hover:bg-slate-50/60 transition-colors ${isCamp ? 'bg-purple-50/20' : ''}`}>
                              <td className="py-4 px-5">
                                <div className="space-y-0.5">
                                  {isCamp ? (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-mono text-[10px] font-bold rounded-md inline-flex items-center gap-1">
                                      <Tent className="w-3 h-3 text-purple-700" />
                                      {prx.prescriptionId}
                                    </span>
                                  ) : (
                                    <span className="font-mono text-[10px] text-teal-700 font-bold tracking-wider block">
                                      {prx.prescriptionId}
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-900 text-sm block mt-1">
                                    {prx.patientName}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block font-mono">
                                    {prx.timestamp ? new Date(prx.timestamp).toLocaleString('en-IN') : 'Just now'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-900 font-bold text-xs">
                                    {prx.patientPhone}
                                  </span>
                                  <a
                                    href={`https://wa.me/91${prx.patientPhone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-md transition-all flex items-center justify-center cursor-pointer shadow-xs"
                                    title="Contact Applicant on WhatsApp"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </a>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                {isCamp ? (
                                  <div className="space-y-1">
                                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold rounded-full inline-block">
                                      ⛺ Health Camp Application
                                    </span>
                                    <p className="text-[11px] text-slate-600 font-medium max-w-xs leading-snug">
                                      {prx.fileName}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 font-mono text-[11px]">
                                    📁 {prx.fileName}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {isCamp ? (
                                  <span className="text-[9.5px] font-extrabold text-purple-900 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                    <Tent className="w-3 h-3 text-purple-700" />
                                    Society Health Camp
                                  </span>
                                ) : prx.dontKnowTests ? (
                                  <span className="text-[9.5px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full inline-block">
                                    📞 Call Needed (Quick Request)
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full inline-block">
                                    ⚙️ Automated Prescription Extract
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 max-w-[240px]">
                                {isCamp ? (
                                  <div className="space-y-1 text-[11px] text-slate-700">
                                    <p className="font-bold text-purple-950 leading-snug">
                                      {prx.doctorName || prx.fileName}
                                    </p>
                                    {Array.isArray(prx.extractedServiceIds) && prx.extractedServiceIds.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {prx.extractedServiceIds.map((item: string, idx: number) => (
                                          <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : prx.extractedServiceIds && prx.extractedServiceIds.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {prx.extractedServiceIds.map((srvId: string, idx: number) => {
                                      const matchService = services.find(s => s.id === srvId);
                                      return (
                                        <div key={idx} className="text-[10.5px] text-slate-700 truncate block font-bold">
                                          • {matchService ? matchService.name : srvId}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">None - Call requested</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`text-[10px] font-extrabold uppercase block ${
                                  prx.status === 'pending_call' ? 'text-amber-600' :
                                  prx.status === 'called' ? 'text-indigo-600' : 'text-emerald-600'
                                }`}>
                                  {prx.status === 'pending_call' ? '● Pending Follow-up' :
                                    prx.status === 'called' ? '● Contacted & Scheduled' : '● Converted'}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <div className="flex gap-2 justify-end">
                                  {prx.status === 'pending_call' && (
                                    <button
                                      onClick={() => handleUpdatePrescriptionStatus(prx.id, 'called')}
                                      className="px-2.5 py-1.5 bg-[#2D006B] hover:bg-[#3B008D] text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                                    >
                                      Mark Contacted
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeletePrescription(prx.id)}
                                    className="p-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors cursor-pointer"
                                    title="Delete Lead"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Careers & Job Applications Manager */}
        {activeTab === 'careers' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-teal-50 text-teal-800 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Careers Division</span>
                <h3 className="text-xl font-serif font-bold text-slate-900 font-light">Job Application Portal</h3>
                <p className="text-xs text-slate-500 font-medium">Track, review, shortlist, and manage candidate submissions for various lab and clinic roles.</p>
              </div>
              <button
                onClick={() => fetchDatabaseData(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all bg-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Applications</span>
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3">
                <Building className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No Applications Submitted</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">There are no job applications stored in the database right now. New submissions from the Careers page will appear here instantly.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Submitted Job Profiles ({applications.length})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-250 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                        <th className="p-4">Candidate & Role</th>
                        <th className="p-4">Contact Details</th>
                        <th className="p-4">Experience</th>
                        <th className="p-4">Notes & Resume</th>
                        <th className="p-4">Applied On</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 font-semibold text-slate-700 bg-white">
                      {applications.map((appItem) => (
                        <tr key={appItem.applicationId || appItem.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-900 block text-xs">{appItem.fullName}</span>
                              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">{appItem.position}</span>
                              <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">ID: {appItem.applicationId}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium">
                            <div className="space-y-0.5 text-slate-600">
                              <span className="block">{appItem.email}</span>
                              <span className="block text-[11px] font-bold text-slate-450">{appItem.phone}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-slate-900 font-bold whitespace-nowrap">
                            {appItem.experience}
                          </td>
                          <td className="p-4 max-w-[240px]">
                            <div className="space-y-1.5 font-medium">
                              {appItem.resumeLink ? (
                                <a
                                  href={appItem.resumeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline font-bold text-[10.5px] bg-emerald-50 px-2 py-0.5 rounded-md"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Resume</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold block">No Resume Provided</span>
                              )}
                              {appItem.notes && (
                                <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                  "{appItem.notes}"
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-550 whitespace-nowrap text-[11px] font-medium">
                            {new Date(appItem.timestamp || Date.now()).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${appItem.status === 'shortlisted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : appItem.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                                }`}
                            >
                              {appItem.status || 'pending'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-1.5">
                              {appItem.status !== 'shortlisted' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await adminFetch(`/api/admin/careers/${appItem.id}/status`, {
                                        method: 'PATCH',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'X-Admin-Key': 'assurx2026health'
                                        },
                                        body: JSON.stringify({ status: 'shortlisted' })
                                      });
                                      if (res.ok) {
                                        showToast('Candidate shortlisted successfully!', 'success');
                                        fetchDatabaseData(true);
                                      } else {
                                        showToast('Failed to update status', 'error');
                                      }
                                    } catch (err) {
                                      showToast('Error updating status', 'error');
                                    }
                                  }}
                                  className="border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-500 transition-all cursor-pointer font-bold text-[10px] px-2 py-1 bg-white"
                                >
                                  Shortlist
                                </button>
                              )}
                              {appItem.status !== 'rejected' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await adminFetch(`/api/admin/careers/${appItem.id}/status`, {
                                        method: 'PATCH',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'X-Admin-Key': 'assurx2026health'
                                        },
                                        body: JSON.stringify({ status: 'rejected' })
                                      });
                                      if (res.ok) {
                                        showToast('Candidate status updated to rejected', 'info');
                                        fetchDatabaseData(true);
                                      } else {
                                        showToast('Failed to update status', 'error');
                                      }
                                    } catch (err) {
                                      showToast('Error updating status', 'error');
                                    }
                                  }}
                                  className="border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 rounded-lg text-slate-500 transition-all cursor-pointer font-bold text-[10px] px-2 py-1 bg-white"
                                >
                                  Reject
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  triggerConfirm(
                                    'Delete Job Application',
                                    `Are you sure you want to permanently delete ${appItem.fullName}'s application for ${appItem.position}? This action cannot be undone.`,
                                    'Delete Application',
                                    async () => {
                                      try {
                                        const res = await adminFetch(`/api/admin/careers/${appItem.id}`, {
                                          method: 'DELETE'
                                        });
                                        if (res.ok) {
                                          showToast('Job application deleted successfully', 'success');
                                          fetchDatabaseData(true);
                                        } else {
                                          showToast('Failed to delete application', 'error');
                                        }
                                      } catch (err) {
                                        showToast('Error deleting application', 'error');
                                      } finally {
                                        setConfirmAction(null);
                                      }
                                    }
                                  );
                                }}
                                className="p-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors cursor-pointer bg-white"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Homepage Sections Manager */}
        {activeTab === 'sections' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Design & Layout Division</span>
                <h3 className="text-xl font-serif font-bold text-slate-900 font-light">Homepage Core Offerings Sections</h3>
                <p className="text-xs text-slate-500 font-medium">Add, customize, reorder, or remove offering grids on the homepage (like Popular Scans & Labs).</p>
              </div>
              <button
                onClick={() => {
                  resetSectionForm();
                  setIsAddingSection(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Section</span>
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3">
                <LayoutGrid className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No Homepage Sections Defined</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">Create a dynamic diagnostic offerings card to show test panels on the public website homepage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                  <div key={section.id} className="bg-white border border-slate-200 rounded-[28px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-[21/9] bg-slate-100 overflow-hidden">
                      <img
                        src={section.bannerImage === 'bloodTestingBanner' ? 'https://images.unsplash.com/photo-1579154204601-01588f351167?q=80&w=1200&auto=format&fit=crop' : section.bannerImage}
                        alt={section.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3 text-left">
                        <span className="bg-emerald-600 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded inline-block">{section.bannerTag}</span>
                        <p className="text-white text-[11px] font-bold leading-tight mt-0.5">{section.bannerTitle}</p>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] uppercase tracking-wide font-extrabold rounded-md">
                              Category: {section.category.toUpperCase()}
                            </span>
                            <h4 className="font-serif font-bold text-slate-900 text-base mt-1.5">{section.title}</h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveSection(idx, 'up')}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === sections.length - 1}
                              onClick={() => handleMoveSection(idx, 'down')}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold">{section.subtitle}</p>

                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Service Offerings Filter:</span>
                          {section.serviceIds && section.serviceIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {section.serviceIds.map(id => {
                                const svc = services.find(s => s.id === id);
                                return (
                                  <span key={id} className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200/60 rounded text-[9.5px] font-bold text-slate-600">
                                    {svc ? svc.name.split(' (')[0] : id}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-650 font-bold">Auto-displays popular {section.category === 'all' ? 'scans & lab tests' : `${section.category}s`} from catalog.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenEditSection(section)}
                          className="px-3 py-1.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer bg-white flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Card</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="px-3 py-1.5 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 text-slate-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer bg-white flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Modal overlay for adding / editing a section */}
            {isAddingSection && (
              <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs text-left animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-scale-in">

                  {/* Modal Title */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black text-emerald-700 tracking-widest uppercase block">Public layout builder</span>
                      <h3 className="text-lg font-serif font-bold text-slate-900">
                        {editingSectionId ? 'Update Section' : 'Create Custom Offering Section'}
                      </h3>
                    </div>
                    <button
                      onClick={resetSectionForm}
                      className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Scrollable Body */}
                  <form onSubmit={editingSectionId ? handleEditSectionSubmit : handleAddSectionSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold text-slate-700">

                    {/* Section Title */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section Title</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Popular Cardiac Tests"
                        value={secTitle}
                        onChange={(e) => setSecTitle(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50 focus:bg-white font-semibold text-slate-800"
                      />
                    </div>

                    {/* Section Subtitle */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Section Subtitle / Badges</label>
                      <input
                        type="text"
                        placeholder="E.g. Verified Cardiac Panels • 12 Hour Reports"
                        value={secSubtitle}
                        onChange={(e) => setSecSubtitle(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50 focus:bg-white font-semibold text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Department filter Category */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catalog Category Filter</label>
                        <select
                          value={secCategory}
                          onChange={(e) => setSecCategory(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-850"
                        >
                          <option value="scan">Sonography & Scans (Radiology)</option>
                          <option value="lab">Lab Tests (Pathology)</option>
                          <option value="all">All Catalog Items</option>
                        </select>
                      </div>

                      {/* View All redirect tab */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">"View All" Redirect Link Tab</label>
                        <select
                          value={secViewAllTab}
                          onChange={(e) => setSecViewAllTab(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-850"
                        >
                          <option value="scans">Sonography & Diagnostic Scans Page</option>
                          <option value="labs">Pathology & Blood Labs Page</option>
                        </select>
                      </div>
                    </div>

                    {/* Banner Image URL and Presets */}
                    <div className="space-y-2.5 bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="space-y-1 flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Banner Image URL</label>
                          <input
                            type="text"
                            required
                            placeholder="Paste Unsplash stock URL or custom graphic link"
                            value={secBannerImage}
                            onChange={(e) => setSecBannerImage(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-[10.5px] bg-white focus:outline-none font-mono text-slate-700"
                          />
                        </div>
                        <div className="space-y-1 flex-shrink-0">
                          <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Or Upload Image</span>
                          <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-650 hover:text-slate-800 rounded-lg text-[10.5px] cursor-pointer font-bold shadow-xs">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Choose File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBannerImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Presets Selection */}
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-bold text-slate-450 uppercase block">Or Choose a Premium Clinic Banner Preset:</span>
                        <div className="flex flex-wrap gap-2 pt-1 select-none">
                          <button
                            type="button"
                            onClick={() => setSecBannerImage('https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200&auto=format&fit=crop')}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 rounded text-[9px] bg-white text-slate-650 cursor-pointer"
                          >
                            🔬 Scanning Room
                          </button>
                          <button
                            type="button"
                            onClick={() => setSecBannerImage('https://images.unsplash.com/photo-1579154204601-01588f351167?q=80&w=1200&auto=format&fit=crop')}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 rounded text-[9px] bg-white text-slate-650 cursor-pointer"
                          >
                            🧪 Pathology Labs
                          </button>
                          <button
                            type="button"
                            onClick={() => setSecBannerImage('https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop')}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 rounded text-[9px] bg-white text-slate-650 cursor-pointer"
                          >
                            🏥 Medical Tech
                          </button>
                          <button
                            type="button"
                            onClick={() => setSecBannerImage('https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=1200&auto=format&fit=crop')}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 rounded text-[9px] bg-white text-slate-650 cursor-pointer"
                          >
                            ❤️ Heart Cardiology
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Banner tag badge */}
                      <div className="space-y-1 sm:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Banner Badge Tag</label>
                        <input
                          type="text"
                          required
                          placeholder="E.g. Advanced Clinic"
                          value={secBannerTag}
                          onChange={(e) => setSecBannerTag(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50/50 focus:bg-white text-slate-800"
                        />
                      </div>
                      {/* Banner description title */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Banner Description Title</label>
                        <input
                          type="text"
                          required
                          placeholder="E.g. Premium Echocardiography & ECG acquisition center"
                          value={secBannerTitle}
                          onChange={(e) => setSecBannerTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50/50 focus:bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Services Selection checkbox board */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Showcase Selection</label>
                        <p className="text-[10px] text-slate-400 font-semibold leading-normal">Choose manually which diagnostic tests display in this section. Leave unchecked to auto-display popular tests from the selected category.</p>
                      </div>
                      <div className="border border-slate-200 rounded-2xl max-h-40 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
                        {services
                          .filter(srv => secCategory === 'all' || srv.category === secCategory)
                          .map(srv => (
                            <label key={srv.id} className="flex items-center gap-2.5 py-1 text-xs cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={secServiceIds.includes(srv.id)}
                                onChange={() => toggleSectionServiceSelection(srv.id)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-semibold text-slate-850">[{srv.category.toUpperCase()}] {srv.name}</span>
                              <span className="text-slate-450 text-[10px]">• ₹{srv.discountPrice || srv.price}</span>
                            </label>
                          ))}
                      </div>
                    </div>

                    {/* Form actions footer */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={resetSectionForm}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold transition-all hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer"
                      >
                        {editingSectionId ? 'Save & Update Section' : 'Create Section'}
                      </button>
                    </div>

                  </form>

                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Clinic Branches Directory */}
        {activeTab === 'branches' && (
          <div className="space-y-6 animate-fade-in">

            {/* Header controls row */}
            <div className="bg-[#fcfcfb] border border-gray-200 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Clinic Branches Directory</h3>
                <p className="text-[11px] text-slate-400">Manage address, contact numbers, and location details shown in footers, search, and checkout forms.</p>
              </div>
              <button
                onClick={() => setIsAddingCenter(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Branch</span>
              </button>
            </div>

            {/* Add New Branch Form Card */}
            {isAddingCenter && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-850 text-xs md:text-sm flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>Register New Clinic Branch</span>
                  </h4>
                  <button
                    onClick={() => setIsAddingCenter(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddCenterSubmit} className="space-y-4 text-left font-semibold text-xs text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Branch Name / City */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Branch Name / City Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Andheri, Bandra, Thane"
                        value={newCenterCity}
                        onChange={(e) => setNewCenterCity(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    {/* Phone Contact */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Branch Contact Phone</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 022-50117703"
                        value={newCenterPhone}
                        onChange={(e) => setNewCenterPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    {/* WhatsApp Contact */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Branch WhatsApp Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 919830678387 or +91 9830678387"
                        value={newCenterWhatsappNumber}
                        onChange={(e) => setNewCenterWhatsappNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                    {/* Full Address */}
                    <div className="space-y-1 md:col-span-3">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Branch Full Address</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shop 5, Ground Floor, Lokhandwala Complex, Andheri West, Mumbai - 400053"
                        value={newCenterAddress}
                        onChange={(e) => setNewCenterAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingCenter(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer"
                    >
                      Register Branch
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List Table of Branches */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-4 px-5 w-40">Branch Name</th>
                      <th className="py-4 px-4">Clinic Address</th>
                      <th className="py-4 px-4 w-44">Phone Contact</th>
                      <th className="py-4 px-4 w-44">WhatsApp Contact</th>
                      <th className="py-4 px-5 text-right w-56">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-slate-700 font-semibold text-left">
                    {centers.map((center) => (
                      <tr key={center.city} className="hover:bg-slate-50/40">
                        <td className="py-4 px-5">
                          {editingCenterCity === center.city ? (
                            <input
                              type="text"
                              value={editCenterCity}
                              onChange={(e) => setEditCenterCity(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-350 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold uppercase text-emerald-900"
                            />
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit">
                              <Building className="w-3.5 h-3.5 text-emerald-600" />
                              {center.city}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editingCenterCity === center.city ? (
                            <input
                              type="text"
                              value={editCenterAddress}
                              onChange={(e) => setEditCenterAddress(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-350 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                            />
                          ) : (
                            <span className="text-slate-700 text-[12.5px]">{center.address}</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editingCenterCity === center.city ? (
                            <input
                              type="text"
                              value={editCenterPhone}
                              onChange={(e) => setEditCenterPhone(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-350 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                            />
                          ) : (
                            <span className="text-emerald-700 font-bold font-mono text-[12.5px]">{center.phone}</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editingCenterCity === center.city ? (
                            <input
                              type="text"
                              value={editCenterWhatsappNumber}
                              onChange={(e) => setEditCenterWhatsappNumber(e.target.value)}
                              placeholder="WhatsApp Number"
                              className="w-full px-3 py-1.5 border border-slate-350 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                            />
                          ) : (
                            <span className="text-emerald-600 font-bold font-mono text-[12.5px] flex items-center gap-1">
                              💬 {center.whatsappNumber || center.phone}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {editingCenterCity === center.city ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleSaveCenter(center.city)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCenterCity(null)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => handleStartEditCenter(center)}
                                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-655 font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCenter(center.city)}
                                className="px-2.5 py-1.5 border border-slate-200 hover:border-rose-355 hover:bg-rose-50 hover:text-rose-700 text-slate-550 font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Remove Branch"
                              >
                                <Trash2 className="w-3 h-3 text-slate-400" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 9: Patient Complaints Manager */}
        {activeTab === 'complaints' && (() => {
          const filteredComplaints = complaintFilter === 'all'
            ? complaints
            : complaints.filter(c => c.status === complaintFilter);

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

          const handleStatusChange = (id: string, newStatus: PatientComplaint['status']) => {
            const updated = complaints.map(c => c.id === id ? { ...c, status: newStatus } : c);
            setComplaints(updated);
            localStorage.setItem('assurx_complaints', JSON.stringify(updated));
          };

          const handleSaveNote = (id: string) => {
            const updated = complaints.map(c => c.id === id ? { ...c, adminNotes: complaintAdminNote } : c);
            setComplaints(updated);
            localStorage.setItem('assurx_complaints', JSON.stringify(updated));
            setEditingComplaintId(null);
            setComplaintAdminNote('');
          };

          const handleDeleteComplaint = (id: string) => {
            const updated = complaints.filter(c => c.id !== id);
            setComplaints(updated);
            localStorage.setItem('assurx_complaints', JSON.stringify(updated));
          };

          const openCount = complaints.filter(c => c.status === 'open').length;
          const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
          const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

          return (
            <div className="space-y-5 animate-fade-in">
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-rose-700">{openCount}</p>
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-1">Open</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-amber-700">{inProgressCount}</p>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-1">In Progress</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-emerald-700">{resolvedCount}</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Resolved</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-slate-700">{complaints.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'open', 'in_progress', 'resolved', 'dismissed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setComplaintFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${complaintFilter === f
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                  >
                    {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? complaints.length : complaints.filter(c => c.status === f).length})
                  </button>
                ))}
                <button
                  onClick={() => {
                    const stored = JSON.parse(localStorage.getItem('assurx_complaints') || '[]');
                    setComplaints(stored);
                  }}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white text-slate-500 border-slate-200 hover:border-slate-400 transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {/* Complaints List */}
              {filteredComplaints.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center mx-auto mb-4">
                    <MessageSquareWarning className="w-7 h-7 text-slate-300" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-400">No Complaints</h4>
                  <p className="text-[11px] text-slate-400 mt-1">No patient complaints found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredComplaints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(complaint => (
                    <div key={complaint.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {/* Complaint Header */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusColors[complaint.status]}`}>
                              {statusLabels[complaint.status]}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                              {categoryLabels[complaint.category]}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {complaint.branch} Branch
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-xs">{complaint.subject}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{complaint.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {new Date(complaint.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(complaint.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Patient Info Row */}
                      <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1.5 text-[10px]">
                        <span><strong className="text-slate-500">Patient:</strong> <span className="text-slate-700 font-semibold">{complaint.patientName}</span></span>
                        <span><strong className="text-slate-500">Phone:</strong> <span className="text-slate-700 font-semibold">{complaint.phone}</span></span>
                        {complaint.email && <span><strong className="text-slate-500">Email:</strong> <span className="text-slate-700 font-semibold">{complaint.email}</span></span>}
                        {complaint.bookingId && <span><strong className="text-slate-500">Booking:</strong> <span className="text-teal-700 font-bold">{complaint.bookingId}</span></span>}
                        <span><strong className="text-slate-500">ID:</strong> <span className="text-slate-400 font-mono text-[9px]">{complaint.id}</span></span>
                      </div>

                      {/* Admin Notes */}
                      {complaint.adminNotes && editingComplaintId !== complaint.id && (
                        <div className="px-4 py-2.5 bg-blue-50/50 border-t border-blue-100">
                          <p className="text-[10px] text-blue-800"><strong>Admin Note:</strong> {complaint.adminNotes}</p>
                        </div>
                      )}

                      {/* Editing Admin Note */}
                      {editingComplaintId === complaint.id && (
                        <div className="px-4 py-3 bg-blue-50/50 border-t border-blue-100 space-y-2">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">Admin Note</label>
                          <textarea
                            rows={2}
                            value={complaintAdminNote}
                            onChange={e => setComplaintAdminNote(e.target.value)}
                            placeholder="Add internal notes about this complaint..."
                            className="w-full px-3 py-2 border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setEditingComplaintId(null); setComplaintAdminNote(''); }}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(complaint.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions Row */}
                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <select
                          value={complaint.status}
                          onChange={e => handleStatusChange(complaint.id, e.target.value as PatientComplaint['status'])}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                        <button
                          onClick={() => {
                            setEditingComplaintId(complaint.id);
                            setComplaintAdminNote(complaint.adminNotes || '');
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Note
                        </button>
                        <button
                          onClick={() => handleDeleteComplaint(complaint.id)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'doctors' && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Header controls row */}
            <div className="bg-[#fcfcfb] border border-gray-200 p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Doctors Directory</h3>
                <p className="text-[11px] text-slate-400">Add, edit, or remove clinical medical practitioners from your homepage patient booking listings.</p>
              </div>
              <button
                onClick={() => {
                  resetDoctorForm();
                  setIsAddingDoctor(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm animate-fade-in"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Doctor</span>
              </button>
            </div>

            {/* Add / Edit Doctor Form Card */}
            {isAddingDoctor && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 md:p-6 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-855 text-xs md:text-sm flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-650" />
                    <span>{editingDoctorId ? 'Edit Doctor Profile' : 'Register New Doctor'}</span>
                  </h4>
                  <button
                    onClick={resetDoctorForm}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={editingDoctorId ? handleEditDoctorSubmit : handleAddDoctorSubmit} className="space-y-4 font-semibold text-xs text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Doctor Name */}
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Doctor Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Alok Sharma"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                      />
                    </div>

                    {/* Specialization */}
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Specialization</label>
                      <select
                        value={docSpecialization}
                        onChange={(e) => setDocSpecialization(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800 cursor-pointer"
                      >
                        <option value="Cardiologist">Cardiologist</option>
                        <option value="Gynecologist">Gynecologist</option>
                        <option value="Neurologist">Neurologist</option>
                        <option value="Pediatrician">Pediatrician</option>
                        <option value="General Physician">General Physician</option>
                        <option value="Dermatologist">Dermatologist</option>
                        <option value="Radiologist">Radiologist</option>
                        <option value="Oncologist">Oncologist</option>
                        <option value="Pathology">Pathology</option>
                        <option value="Pathologist">Pathologist</option>
                      </select>
                    </div>

                    {/* Qualification */}
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Qualification</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MD, DM (Cardiology)"
                        value={docQualification}
                        onChange={(e) => setDocQualification(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                      />
                    </div>

                    {/* Experience (Years) */}
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Experience (in Years)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="80"
                        placeholder="e.g. 15"
                        value={docExperience}
                        onChange={(e) => setDocExperience(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                      />
                    </div>

                    {/* Timings */}
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Consulting Hours</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 09:00 AM - 01:00 PM"
                        value={docTiming}
                        onChange={(e) => setDocTiming(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                      />
                    </div>

                    {/* Branch availability */}
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-455 block">Clinic Branch Location</label>
                      <select
                        value={docBranch}
                        onChange={(e) => setDocBranch(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-850 cursor-pointer"
                      >
                        {centers.map(c => (
                          <option key={c.city} value={c.city}>{c.city}</option>
                        ))}
                      </select>
                    </div>

                    {/* Avatar URL & Upload */}
                    <div className="space-y-1 md:col-span-3 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Avatar Image URL or Upload</label>
                      <div className="flex gap-3 items-center">
                        <div className="flex-1">
                          <input
                            type="url"
                            placeholder="Paste image address or use upload button"
                            value={docAvatar}
                            onChange={(e) => setDocAvatar(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold font-mono text-slate-700"
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-800 rounded-xl text-xs cursor-pointer font-bold shadow-xs">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Choose Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleDoctorAvatarUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Action buttons */}
                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetDoctorForm}
                      className="px-4 py-2 border border-slate-200 text-slate-655 hover:bg-slate-55 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      {editingDoctorId ? 'Save Profile' : 'Add Doctor'}
                    </button>
                  </div>
                </form>
              </div>
            )}

{/* Search Bar for Doctors list */ }
<div className="bg-[#fcfcfb] border border-gray-205 p-3 rounded-2xl flex items-center justify-between gap-3">
  <div className="relative flex-1 max-w-sm">
    <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
    <input
      type="text"
      placeholder="Filter doctors by name, specialty, or branch..."
      value={docSearch}
      onChange={(e) => setDocSearch(e.target.value)}
      className="w-full pl-8.5 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-700"
    />
  </div>
  <span className="text-[10px] text-slate-400 font-bold uppercase">
    Showing {
      doctors.filter(d =>
        d.name.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.specialization.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.branch.toLowerCase().includes(docSearch.toLowerCase())
      ).length
    } of {doctors.length} Doctors
  </span>
</div>

{/* Doctors Grid */ }
{
  doctors.length === 0 ? (
    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-12 text-center">
      <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h4 className="font-bold text-slate-700 text-sm">No Doctors Registered</h4>
      <p className="text-[11px] text-slate-400 mt-1">Register a doctor to see their profile here.</p>
    </div>
  ) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {doctors
      .filter(d =>
        d.name.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.specialization.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.branch.toLowerCase().includes(docSearch.toLowerCase())
      )
      .map((doc) => (
        <div
          key={doc.id}
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-emerald-500/40"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-150 flex-shrink-0">
              <img
                src={doc.avatar || 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=300&auto=format&fit=crop'}
                alt={doc.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Info details */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="font-bold text-slate-800 text-xs md:text-sm">{doc.name}</h4>
              </div>
              <p className="text-[10px] text-teal-605 font-bold uppercase tracking-wider">
                {doc.qualification}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">
                {doc.specialization} • {doc.experience} Years Experience
              </p>
            </div>
          </div>

          {/* Consultation metadata */}
          <div className="my-4 border-t border-b border-slate-100 py-3 space-y-2 text-[10.5px] text-slate-550">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Timings: <strong className="text-slate-655">{doc.timing}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Branch: <strong className="text-slate-655">{doc.branch}</strong></span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenEditDoctor(doc)}
              className="flex-1 py-1.5 border border-slate-205 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-650 hover:text-emerald-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleDeleteDoctor(doc.id)}
              className="px-3 py-1.5 border border-slate-205 hover:border-red-500 hover:bg-red-50/30 text-slate-500 hover:text-red-705 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
  </div>
)
}
          </div >
        )}

        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md text-left space-y-6 animate-fade-in">
            <div>
              <span className="text-[9px] font-black text-emerald-700 tracking-widest uppercase block">CREDENTIAL MANAGEMENT</span>
              <h3 className="text-lg font-serif font-bold text-slate-900">Security & API Keys</h3>
              <p className="text-xs text-slate-500 mt-1">Modify your administrator access passwords and core API validation keys.</p>
            </div>

            {securityMessage && (
              <div className={`p-4 border rounded-2xl text-xs font-bold ${
                securityMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {securityMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateSecurity} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">New Admin Key (X-Admin-Key)</label>
                <input
                  type="text"
                  placeholder="Enter new admin key"
                  value={newAdminKey}
                  onChange={(e) => setNewAdminKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={securityLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-150 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {securityLoading ? 'Updating credentials...' : 'Save Credentials'}
              </button>
            </form>
          </div>
        )}

      </div >

  {/* --- EDIT PATIENT DETAILS MODAL POPUP --- */ }
{
  editingPatientBooking && (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs text-left animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-scale-in">

        {/* Modal Title */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <span className="text-[9px] font-black text-emerald-700 tracking-widest uppercase block">CLINICAL DATABASE RECORDS</span>
            <h3 className="text-lg font-serif font-bold text-slate-900">Modify Patient details: {cleanBookingId(editingPatientBooking.bookingId)}</h3>
          </div>
          <button
            onClick={() => setEditingPatientBooking(null)}
            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-semibold text-slate-700">

          {/* Patient Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient Name</label>
            <input
              type="text"
              required
              placeholder="Patient Name"
              value={editedPatientName}
              onChange={(e) => setEditedPatientName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Age (Years)</label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={editedPatientAge}
                onChange={(e) => setEditedPatientAge(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gender</label>
              <select
                value={editedPatientGender}
                onChange={(e) => setEditedPatientGender(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-850"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Appointment Date */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Appointment Date</label>
              <input
                type="date"
                required
                value={editedAppointmentDate}
                onChange={(e) => setEditedAppointmentDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
              />
            </div>

            {/* Appointment Time */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Appointment Time Slot</label>
              <select
                value={editedAppointmentTime}
                onChange={(e) => setEditedAppointmentTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-850"
              >
                <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
              </select>
            </div>
          </div>

          {/* Sample Collection Type */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sample Collection Method</label>
            <select
              value={editedCollectionType}
              onChange={(e) => setEditedCollectionType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-850"
            >
              <option value="center">🏢 Diagnostic Center Walk-in</option>
              <option value="home">🏠 Sterile Home Blood Collection (+₹150)</option>
            </select>
          </div>

          {/* Street Address, City, Pincode */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3.5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Collection Location Details</span>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Street Address / House No.</label>
              <input
                type="text"
                value={editedStreet}
                onChange={(e) => setEditedStreet(e.target.value)}
                placeholder="Flat/House No., building, street"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">City / Branch Zone</label>
                <select
                  value={editedCity}
                  onChange={(e) => setEditedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none text-slate-800"
                >
                  <option value="Malad">Malad</option>
                  <option value="Goregaon">Goregaon</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={editedPincode}
                  onChange={(e) => setEditedPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6 Digits"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none text-slate-800"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal actions footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={() => setEditingPatientBooking(null)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold transition-all hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePatientDetails}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer"
          >
            Save Changes & Sync
          </button>
        </div>

      </div>
    </div>
  )
}

{/* --- DETAILED CLINICAL RESULTS EDIT MODAL POPUP --- */ }
{
  editingBooking && (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs text-left">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-scale-in">

        {/* Modal Title */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <span className="text-[9px] font-black text-emerald-700 tracking-widest uppercase block">CLINICAL DIAGNOSTIC DATA PUBLISHER</span>
            <h3 className="text-lg font-serif font-bold text-slate-900">Publish Findings: {cleanBookingId(editingBooking.bookingId)}</h3>
          </div>
          <button
            onClick={() => setEditingBooking(null)}
            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">

          {/* Patient Brief */}
          <div className="bg-emerald-50/35 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Details</span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">{editingBooking.patient.name}</span>
              <span className="text-[10px] text-slate-500 font-semibold">{editingBooking.patient.age} Yrs • {editingBooking.patient.gender}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch Dispatch</span>
              <span className="font-bold text-slate-800 block mt-0.5">{editingBooking.address?.city || 'Malad'} Branch</span>
            </div>
          </div>

          {/* Department Check */}
          {editingBooking.items.some(it => it.category === 'lab') ? (
            /* pathology biochemistry input sheet */
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">1. Laboratory Pathology Parameter Results</h4>
                <p className="text-slate-450 text-[10.5px]">Provide exact clinical bio-marker values analyzed in the branch laboratory.</p>
              </div>

              <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 font-semibold text-slate-700">
                <div className="grid grid-cols-4 bg-slate-50 p-2.5 text-[9px] font-bold text-slate-400 uppercase">
                  <div className="col-span-2">Clinical Parameter</div>
                  <div className="text-center">Observed Result Value</div>
                  <div className="text-right">Standard Ref Range</div>
                </div>

                {reportResults.map((param, index) => (
                  <div key={index} className="grid grid-cols-4 p-3 items-center">
                    <div className="col-span-2 font-bold text-slate-800">{param.parameter}</div>
                    <div className="flex justify-center">
                      <input
                        type="text"
                        required
                        value={param.result}
                        onChange={(e) => updateResultValue(index, e.target.value)}
                        className="w-20 px-2 py-1 text-center font-bold border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                      <span className="text-[10px] text-slate-400 ml-1 mt-1.5">{param.unit}</span>
                    </div>
                    <div className="text-right text-slate-400 font-mono text-[10.5px]">{param.range}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {editingBooking.items.some(it => it.category === 'scan') ? (
            /* radiology diagnostic reports findings input sheets */
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">2. Radiology (MRI / CT / Ultrasound) Medical Narrative</h4>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Radiological Findings</label>
                  <textarea
                    rows={4}
                    required
                    value={scanFindings}
                    onChange={(e) => setScanFindings(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl font-semibold leading-relaxed text-slate-700 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Final Doctor Impression</label>
                  <textarea
                    rows={2}
                    required
                    value={scanImpression}
                    onChange={(e) => setScanImpression(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl font-bold leading-relaxed text-slate-800 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : null}

        </div>

        {/* Modal actions footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={() => setEditingBooking(null)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold transition-all hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClinicalResults}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer"
          >
            Release & Publish Reports
          </button>
        </div>

      </div>
    </div>
  )
}

{/* --- ADMIN VIEW ORDER DETAILS MODAL --- */ }
{
  viewingOrderBooking && (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs text-left animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-scale-in">

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <span className="text-[9px] font-black text-sky-700 tracking-widest uppercase block">SECURE CLINICAL RECORD VIEWER</span>
            <h3 className="text-lg font-serif font-bold text-slate-900">Order & Booking Details: {cleanBookingId(viewingOrderBooking.bookingId)}</h3>
          </div>
          <button
            onClick={() => setViewingOrderBooking(null)}
            className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">

          {/* Patient & Appointment Core Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Demographics</span>
              <div className="space-y-1 font-semibold text-slate-800">
                <p className="text-sm font-extrabold text-slate-900">{viewingOrderBooking.patient.name}</p>
                <p>Age: {viewingOrderBooking.patient.age} Years</p>
                <p>Gender: {viewingOrderBooking.patient.gender}</p>
                <p>Relationship: {viewingOrderBooking.patient.relationship}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appointment Timeline</span>
              <div className="space-y-1 font-semibold text-slate-800">
                <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{viewingOrderBooking.appointmentDate}</span>
                </p>
                <p>Time Slot: {viewingOrderBooking.appointmentTime}</p>
                <p className="capitalize">Collection: {viewingOrderBooking.collectionType === 'home' ? '🏠 Home Collection' : '🏢 Walk-In Center Visit'}</p>
                <p>Status: <span className="font-extrabold uppercase text-emerald-700">{viewingOrderBooking.bookingStatus.replace('_', ' ')}</span></p>
              </div>
            </div>
          </div>

          {/* Address details if Home collection */}
          {viewingOrderBooking.collectionType === 'home' && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dispatch Address</span>
              <p className="font-bold text-slate-800">{viewingOrderBooking.address?.street}, {viewingOrderBooking.address?.city} - {viewingOrderBooking.address?.pincode}</p>
            </div>
          )}

          {/* Ordered Items and Pricing */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnostic Services Ordered</span>
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-3">Test / Package Name</th>
                    <th className="p-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {viewingOrderBooking.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="p-3 font-bold text-slate-800">{item.name}</td>
                      <td className="p-3 text-right font-mono text-slate-900">₹{item.discountPrice || item.price}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/50 font-bold">
                    <td className="p-3 text-slate-900">Total Amount</td>
                    <td className="p-3 text-right font-mono text-base text-emerald-800">₹{viewingOrderBooking.totalAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] text-slate-500 font-bold">Payment Method: <span className="uppercase text-slate-700">{viewingOrderBooking.paymentMethod}</span></span>
              <span className={`text-[10px] font-bold uppercase ${viewingOrderBooking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                Payment Status: {viewingOrderBooking.paymentStatus === 'paid' ? 'Paid' : 'Cash on Delivery / Pending'}
              </span>
            </div>
          </div>

          {/* Clinical Results & Report Preview */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Reports & Findings</span>
              {viewingOrderBooking.bookingStatus === 'report_ready' && viewingOrderBooking.simulatedReportUrl && (
                <a
                  href={viewingOrderBooking.simulatedReportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] rounded-lg flex items-center gap-1 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Download Patient PDF Report</span>
                </a>
              )}
            </div>

            {viewingOrderBooking.bookingStatus === 'report_ready' ? (
              <div className="space-y-4">
                {/* Lab parameters if lab service */}
                {viewingReportResults.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-extrabold text-slate-450 uppercase block">Laboratory Chemistry & Biomarkers</span>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-200 text-[9px] text-slate-400 font-black uppercase">
                            <th className="p-2">Parameter</th>
                            <th className="p-2">Result</th>
                            <th className="p-2">Unit</th>
                            <th className="p-2">Reference Range</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-bold text-slate-700 text-[11px]">
                          {viewingReportResults.map((param, index) => (
                            <tr key={index} className="hover:bg-slate-50/20">
                              <td className="p-2 text-slate-900">{param.parameter}</td>
                              <td className="p-2 font-mono text-slate-800">{param.result}</td>
                              <td className="p-2 text-slate-500 font-medium">{param.unit}</td>
                              <td className="p-2 text-slate-500 font-medium">{param.range}</td>
                              <td className="p-2">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${param.status === 'high' ? 'bg-amber-100 text-amber-800' :
                                  param.status === 'low' ? 'bg-blue-100 text-blue-800' :
                                    'bg-emerald-100 text-emerald-800'
                                  }`}>
                                  {param.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Scan findings if radiology */}
                {viewingFindings && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-extrabold text-slate-450 uppercase block">Radiology Clinical Description</span>
                      <div className="p-3 bg-white border border-slate-150 rounded-xl text-[10.5px] font-medium text-slate-600 italic leading-relaxed">
                        "{viewingFindings}"
                      </div>
                    </div>
                    {viewingImpression && (
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-extrabold text-slate-450 uppercase block">Radiologist Impression</span>
                        <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-900 uppercase">
                          {viewingImpression}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-xl text-[11px] text-amber-800 font-bold text-center">
                Clinical findings have not been published yet. Set status to "Report Released" or click "Publish Report" to create lab findings.
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={() => setViewingOrderBooking(null)}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold transition-all cursor-pointer"
          >
            Close Order View
          </button>
        </div>

      </div>
    </div>
  )
}

{/* --- CUSTOM FLOATING TOAST --- */ }
{
  toast.show && (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-bounce-short text-xs font-bold max-w-sm ${toast.type === 'success'
        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
        : toast.type === 'error'
          ? 'bg-rose-50 text-rose-950 border-rose-250'
          : 'bg-slate-50 text-slate-900 border-slate-200'
        }`}
    >
      <div className="flex-1">{toast.message}</div>
      <button
        onClick={() => setToast(prev => ({ ...prev, show: false }))}
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

{/* --- CUSTOM IN-APP CONFIRM MODAL --- */ }
{
  confirmAction && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9990]">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up text-left">
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-base font-serif font-bold text-slate-900">{confirmAction.title}</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            {confirmAction.message}
          </p>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={() => setConfirmAction(null)}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => confirmAction.onConfirm()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-150 cursor-pointer"
          >
            {confirmAction.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

    </div >
  );
}
