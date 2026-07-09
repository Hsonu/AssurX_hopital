import React, { useState } from 'react';
import { X, ShoppingBag, ShieldCheck, Calendar, MapPin, Trash2, Plus, UserPlus, Info, Home, Building } from 'lucide-react';
import { CartItem, Patient } from '../types';
import { ASSURX_CENTERS } from '../data';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: (bookingDetails: {
    patient: Patient;
    collectionType: 'home' | 'center';
    appointmentDate: string;
    appointmentTime: string;
    address?: { street: string; city: string; pincode: string };
  }) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onRemoveFromCart,
  onClearCart,
  onProceedToCheckout,
}: CartDrawerProps) {
  const [collectionType, setCollectionType] = useState<'home' | 'center'>('center');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('08:00 AM - 10:00 AM');
  
  // Patient details state
  const [patient, setPatient] = useState<Patient>({
    name: '',
    age: 30,
    gender: 'Male',
    relationship: 'Self'
  });

  const [familyMembers, setFamilyMembers] = useState<Patient[]>([]);
  const [showAddFamilyForm, setShowAddFamilyForm] = useState(false);
  const [newMember, setNewMember] = useState<Patient>({
    name: '',
    age: 45,
    gender: 'Female',
    relationship: 'Mother'
  });

  // Home collection address state
  const [address, setAddress] = useState({
    street: '',
    city: 'Malad',
    pincode: ''
  });

  if (!isOpen) return null;

  // Check if any cart item is a scan (MRI, CT, USG, X-Ray, etc. cannot be done at home)
  const hasScanItem = cart.some(item => {
    // If the category is scan or name starts with MRI, CT, Ultrasound, X-Ray, Mammogram, ECHO, DEXA
    return item.category === 'scan' || 
           /mri|ct|ultrasound|usg|x-ray|mammogram|echo|dexa/i.test(item.name);
  });

  // Safe fallback: if there is a scan, force collection to center
  const activeCollectionType = hasScanItem ? 'center' : collectionType;

  // Calculations
  const originalTotal = cart.reduce((acc, item) => acc + item.price, 0);
  const currentTotal = cart.reduce((acc, item) => acc + (item.discountPrice || item.price), 0);
  const totalSavings = originalTotal - currentTotal;
  const homeCollectionFee = activeCollectionType === 'home' ? 150 : 0;
  const taxAmount = Math.round(currentTotal * 0.05); // 5% Healthcare Cess/GST
  const grandTotal = currentTotal + homeCollectionFee + taxAmount;

  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    setFamilyMembers([...familyMembers, newMember]);
    setPatient(newMember); // Automatically select newly added family member
    setShowAddFamilyForm(false);
    setNewMember({ name: '', age: 40, gender: 'Male', relationship: 'Father' });
  };

  const handleProceed = () => {
    if (!patient.name.trim()) {
      alert('Please enter patient name.');
      return;
    }
    if (!appointmentDate) {
      alert('Please select an appointment date.');
      return;
    }
    if (activeCollectionType === 'home' && (!address.street.trim() || !address.pincode.trim())) {
      alert('Please complete the home collection address.');
      return;
    }

    onProceedToCheckout({
      patient,
      collectionType: activeCollectionType,
      appointmentDate,
      appointmentTime,
      address: activeCollectionType === 'home' ? address : undefined
    });
  };

  const timeSlots = [
    '06:00 AM - 08:00 AM (Early Bird)',
    '08:00 AM - 10:00 AM (Recommended)',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM'
  ];

  return (
    <div className="fixed inset-0 z-55 overflow-hidden flex justify-end" id="cart-drawer-container">
      {/* Overlay backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Slide out Panel */}
      <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-2xl z-10 animate-slide-left border-l border-slate-100">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-teal-600" />
            <h3 className="font-extrabold text-slate-800 text-base md:text-lg tracking-tight">Your Booking Cart ({cart.length})</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Browse our scans list, lab profiles, or discounted full body packages to add them here.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
              >
                Start Adding Tests
              </button>
            </div>
          ) : (
            <>
              {/* Selected Items List */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Selected Scans & Tests</span>
                  <button onClick={onClearCart} className="text-red-500 hover:underline">Clear All</button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2.5 bg-slate-50/20 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.itemId} className="flex justify-between items-center py-2 first:pt-0 last:pb-0 gap-3">
                      <div className="text-left flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate">{item.name}</h4>
                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold rounded text-[9px] uppercase tracking-wide mt-1">
                          {item.category === 'scan' ? 'Diagnostic Scan' : 'Blood Lab Test'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-slate-800">₹{item.discountPrice || item.price}</span>
                          {item.discountPrice && (
                            <p className="text-[9px] text-slate-400 line-through">₹{item.price}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => onRemoveFromCart(item.itemId)}
                          className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-slate-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Details</span>
                  {!showAddFamilyForm && (
                    <button
                      onClick={() => setShowAddFamilyForm(true)}
                      className="text-teal-600 hover:text-teal-700 font-bold text-xs flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Family Member</span>
                    </button>
                  )}
                </div>

                {/* Add Family Form */}
                {showAddFamilyForm && (
                  <form onSubmit={handleAddFamilyMember} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 text-left">
                    <h5 className="font-bold text-slate-800 text-xs">New Patient Profile</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                          placeholder="Enter patient full name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Age</label>
                        <input
                          type="number"
                          required
                          value={newMember.age}
                          onChange={(e) => setNewMember({ ...newMember, age: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Gender</label>
                        <select
                          value={newMember.gender}
                          onChange={(e) => setNewMember({ ...newMember, gender: e.target.value as any })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Relationship</label>
                        <select
                          value={newMember.relationship}
                          onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value as any })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddFamilyForm(false)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-bold hover:bg-teal-700"
                      >
                        Save Profile
                      </button>
                    </div>
                  </form>
                )}

                {/* Patient Selectors */}
                <div className="flex flex-wrap gap-2 text-left">
                  <button
                    onClick={() => setPatient({ name: patient.name || '', age: patient.age, gender: patient.gender, relationship: 'Self' })}
                    className={`px-3 py-2 border rounded-xl text-xs font-bold text-left transition-colors cursor-pointer flex-1 min-w-[120px] ${
                      patient.relationship === 'Self'
                        ? 'border-teal-600 bg-teal-55/20 text-teal-800'
                        : 'border-slate-200 hover:bg-slate-55'
                    }`}
                  >
                    <div>Self (Primary)</div>
                    <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                      {patient.relationship === 'Self' && patient.name ? patient.name : 'Not set'}
                    </div>
                  </button>

                  {familyMembers.map((member, index) => (
                    <button
                      key={index}
                      onClick={() => setPatient(member)}
                      className={`px-3 py-2 border rounded-xl text-xs font-bold text-left transition-colors cursor-pointer flex-1 min-w-[120px] ${
                        patient.name === member.name && patient.relationship === member.relationship
                          ? 'border-teal-600 bg-teal-55/20 text-teal-800'
                          : 'border-slate-200 hover:bg-slate-55'
                      }`}
                    >
                      <div>{member.relationship}</div>
                      <div className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">{member.name}</div>
                    </button>
                  ))}
                </div>

                {/* Primary Patient Name Input (if not saved) */}
                <div className="text-left space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-700">Patient demographics for booking:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
                    <input
                      type="text"
                      required
                      placeholder="Patient Name"
                      value={patient.name}
                      onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                      className="sm:col-span-2 w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold focus:ring-1 focus:ring-teal-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Age"
                        value={patient.age || ''}
                        onChange={(e) => setPatient({ ...patient, age: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold"
                      />
                      <select
                        value={patient.gender}
                        onChange={(e) => setPatient({ ...patient, gender: e.target.value as any })}
                        className="flex-1 px-1 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold"
                      >
                        <option value="Male">M</option>
                        <option value="Female">F</option>
                        <option value="Other">O</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Type (Home Collection vs Center Visit) */}
              <div className="space-y-3 border-t border-slate-100 pt-5 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Delivery Mode</span>

                {hasScanItem ? (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <Info className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <span className="font-extrabold">Center Appointment Required:</span> Your cart contains diagnostic scans (MRI, Ultrasound, or X-Ray). Scans must be conducted on-site at our state-of-the-art diagnostic imaging centers. Home Collection is disabled.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCollectionType('center')}
                      className={`p-3 border rounded-xl text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        activeCollectionType === 'center'
                          ? 'border-teal-600 bg-teal-55/20 text-teal-800'
                          : 'border-slate-200 hover:bg-slate-55'
                      }`}
                    >
                      <Building className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-xs">Walk-in at Center</span>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">Visit nearest AssurX center. Zero extra charges.</span>
                    </button>

                    <button
                      onClick={() => setCollectionType('home')}
                      className={`p-3 border rounded-xl text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        activeCollectionType === 'home'
                          ? 'border-teal-600 bg-teal-55/20 text-teal-800'
                          : 'border-slate-200 hover:bg-slate-55'
                      }`}
                    >
                      <Home className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-xs">Home Sample Collection</span>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">Phlebotomist visits home. Sterile protocols. (+₹150)</span>
                    </button>
                  </div>
                )}

                {/* Home Collection Address Fields */}
                {activeCollectionType === 'home' && (
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2.5 animate-fade-in text-left">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Home Collection Address
                    </h5>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="House / Flat No, Street, Landmark"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        >
                          <option value="Malad">Malad Branch</option>
                          <option value="Goregaon">Goregaon Branch</option>
                        </select>
                        <input
                          type="text"
                          required
                          placeholder="Pincode (6 digits)"
                          maxLength={6}
                          value={address.pincode}
                          onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time Selection */}
              <div className="space-y-3 border-t border-slate-100 pt-5 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Slot</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">Appointment Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">Preferred Time Slot</label>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    >
                      {timeSlots.map((slot, idx) => (
                        <option key={idx} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Billing & Checkout Action */}
        {cart.length > 0 && (
          <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 space-y-4">
            {/* Price breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Total List Price</span>
                <span className="line-through">₹{originalTotal}</span>
              </div>
              <div className="flex justify-between font-medium text-emerald-600">
                <span>Special AssurX Discount</span>
                <span>-₹{totalSavings}</span>
              </div>
              {homeCollectionFee > 0 && (
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Home Collection Fee</span>
                  <span>₹{homeCollectionFee}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-slate-600">
                <span>Govt Healthcare GST (5%)</span>
                <span>₹{taxAmount}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 text-sm md:text-base border-t border-slate-200 pt-2.5">
                <span>Grand Total</span>
                <span className="text-teal-700">₹{grandTotal}</span>
              </div>
            </div>

            {/* Satisfaction Trust guarantee */}
            <div className="flex items-center gap-2 bg-teal-50/50 border border-teal-100/40 p-2 rounded-lg text-[10px] text-teal-800 font-semibold leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Free Cancellation • Secure Payments • Certified Phlebotomists</span>
            </div>

            {/* Proceed Buttons */}
            <button
              onClick={handleProceed}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold rounded-xl text-sm shadow-md shadow-teal-600/15 transition-all hover:shadow-lg hover:shadow-teal-600/25 active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Proceed to Pay ₹{grandTotal}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
