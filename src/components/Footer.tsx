import React from 'react';
import { ShieldAlert, Award, ShieldCheck, HeartPulse, Sparkles, MapPin, PhoneCall, Mail } from 'lucide-react';
import { ASSURX_CENTERS } from '../data';

interface FooterProps {
  onNavigate: (tab: 'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings') => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs md:text-sm border-t border-slate-800" id="main-footer">
      
      {/* Brand Trust Bar */}
      <div className="bg-slate-950 border-b border-slate-900 py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-center">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">NABL Accredited</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Labs fully audited to ISO 15189 standards</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">MD Radiologists</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Dual-verified reporting of all scan results</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">2 Crore+ Patients</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Most trusted name in diagnostics & scans</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">Robotic Accuracy</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Minimal human contact for sterile precision</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* Col 1: About - md:col-span-4 */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => onNavigate('home')}>
            <span className="text-3xl font-serif italic font-bold tracking-tighter text-white">AssurX</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            AssurX Scans & Labs is India’s premier diagnostics and advanced medical imaging network. Bridging clinical expertise with futuristic diagnostic technology, we make high-end MRI, CT scans, and complete laboratory blood analyses affordable and accessible for every citizen.
          </p>
          <div className="space-y-1.5 text-[11px]">
            <a href="tel:18001201100" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              <span>Helpline (Toll-Free): 1800-120-1100</span>
            </a>
            <a href="mailto:support@assurx.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-emerald-500" />
              <span>Care: support@assurx.com</span>
            </a>
          </div>
        </div>

        {/* Col 2: Services Index - md:col-span-2.5 */}
        <div className="md:col-span-2.5 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Imaging & Scans</h4>
          <ul className="space-y-2 text-[11px]">
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">1.5T / 3T Brain MRI</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">High-speed CT Scans</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">Pregnancy Ultrasound</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">Digital Chest X-Ray</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">Bilateral Mammography</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">ECG & 2D Echo cardiac</button></li>
          </ul>
        </div>

        {/* Col 3: Lab Tests Index - md:col-span-2.5 */}
        <div className="md:col-span-2.5 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Laboratory Diagnostics</h4>
          <ul className="space-y-2 text-[11px]">
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Complete Blood Count (CBC)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Thyroid Profiles (T3, T4, TSH)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Diabetes Glycated HbA1c</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Cardiovascular Lipid Panel</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Liver Function Tests (LFT)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Vitamin D & B12 screening</button></li>
          </ul>
        </div>

        {/* Col 4: Top Centers - md:col-span-3 */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Top Mumbai Branches</h4>
          <div className="space-y-2 text-[11px] max-h-48 overflow-y-auto pr-1 text-slate-400">
            {ASSURX_CENTERS.map((center, idx) => (
              <div key={idx} className="border-b border-slate-800/60 pb-1.5 last:border-b-0 last:pb-0">
                <span className="font-bold text-slate-300 block">{center.city} Branch</span>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{center.address}</p>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Ph: {center.phone}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Copywrite legal info footer */}
      <div className="bg-slate-950 text-slate-550 border-t border-slate-900 py-6 px-4 md:px-6 text-[10px] md:text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 AssurX Scans & Laboratories Pvt. Ltd. All medical rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors font-semibold">Terms of Use</a>
            <a href="#" className="hover:text-slate-300 transition-colors">HIPAA Compliance</a>
          </div>
        </div>
      </div>

    </footer>
  );
}
